const { app } = require('electron');

// run this as early in the main process as possible
if (require('electron-squirrel-startup')) app.quit();

const { updateElectronApp } = require('update-electron-app');
updateElectronApp(); // additional configuration options available

const { BrowserWindow, ipcMain, dialog, Tray, Menu, Notification } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;
let tray;
let watcher = null;
let watchedFolder = null;
let currentLocale = 'en'; // Язык по умолчанию
let translations = loadTranslations(currentLocale); // Инициализируем переводы

// Загружаем переводы из JSON
function loadTranslations(locale) {
    const localePath = path.join(__dirname, 'locales', `${locale}.json`);
    if (fs.existsSync(localePath)) {
        return JSON.parse(fs.readFileSync(localePath, 'utf-8'));
    }
    console.error(`Translations for locale "${locale}" not found.`);
    return {};
}

// Создаем главное окно
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile('index.html');
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    createMenu(); // Создаем меню
    createTray();
}

// Создаем меню
function createMenu() {
    const template = [
        {
            label: translations.title || 'Folder Cleaner',
            submenu: [
                {
                    label: translations.selectFolder || 'Select Folder',
                    click: async () => {
                        const folderPath = await dialog.showOpenDialog({
                            properties: ['openDirectory'],
                            title: translations.selectFolder || 'Select a folder to watch',
                        });
                        if (!folderPath.canceled) {
                            watchedFolder = folderPath.filePaths[0];
                            startWatching(watchedFolder);
                        }
                    },
                },
                {
                    label: translations.stopWatching || 'Stop Watching',
                    enabled: !!watchedFolder,
                    click: () => {
                        if (watcher) {
                            watcher.close();
                            watcher = null;
                            watchedFolder = null;
                        }
                    },
                },
                { type: 'separator' },
                {
                    label: translations.quit || 'Quit',
                    role: 'quit',
                },
            ],
        },
        {
            label: translations.language || 'Language',
            submenu: [
                {
                    label: 'English',
                    type: 'radio',
                    checked: currentLocale === 'en',
                    click: () => changeLanguage('en'),
                },
                {
                    label: 'Русский',
                    type: 'radio',
                    checked: currentLocale === 'ru',
                    click: () => changeLanguage('ru'),
                },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu); // Устанавливаем меню для всего приложения
}

// Изменение языка
function changeLanguage(locale) {
    currentLocale = locale;
    translations = loadTranslations(currentLocale);
    mainWindow.webContents.send('translations-updated', translations); // Обновляем текст в рендерере
    createMenu(); // Обновляем меню
    if (tray) {
        createTray(); // Обновляем текст в трее
    }
}

// Создаем значок в трее
function createTray() {
    tray = new Tray(path.join(__dirname, '/images/icon.ico'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: translations.title || 'Folder Cleaner',
            enabled: false,
        },
        {
            label: 'Show App',
            click: () => {
                mainWindow.show();
            },
        },
        {
            label: 'Quit',
            click: () => {
                app.quit();
            },
        },
    ]);
    tray.setToolTip(translations.title || 'Folder Cleaner');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
}

// Запускаем приложение
app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Выбор папки
ipcMain.handle('select-folder', async () => {
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: translations.selectFolder || 'Select a folder to watch',
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const selectedFolder = result.filePaths[0];
            watchedFolder = selectedFolder;
            startWatching(selectedFolder);
            return selectedFolder;
        }
    } catch (error) {
        console.error('Error selecting folder:', error);
    }

    return null;
});

// Остановка наблюдения
ipcMain.on('stop-watching', () => {
    if (watcher) {
        watcher.close();
        watcher = null;
        watchedFolder = null;
    }
});

// Наблюдение за папкой
function startWatching(folderPath) {
    if (watcher) {
        watcher.close(); // Закрываем предыдущий watcher, если он есть
    }

    watcher = fs.watch(folderPath, (eventType, fileName) => {
        if (eventType === 'rename' && fileName) {
            organizeDownloads(folderPath, fileName);
        }
    });
}

// Организация файлов
function organizeDownloads(folderPath, fileName) {
    const category = getFileCategory(fileName);
    const categoryPath = path.join(folderPath, category);

    if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath);
    }

    const oldPath = path.join(folderPath, fileName);
    const newPath = path.join(categoryPath, fileName);

    fs.rename(oldPath, newPath, (err) => {
        if (err) {
            console.error(err);
        } else {
            showNotification('notificationFileOrganized', 'notificationMessage', `${fileName} -> ${category}`);
        }
    });
}

// Категоризация файлов
function getFileCategory(fileName) {
    const extension = path.extname(fileName).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(extension)) return translations.images;
    if (['.mp4', '.mkv', '.avi', '.mov', '.wmv'].includes(extension)) return translations.videos;
    if (['.mp3', '.wav', '.aac', '.flac'].includes(extension)) return translations.music;
    if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(extension)) return translations.archives;
    if (['.doc', '.docx', '.pdf', '.txt', '.xlsx', '.pptx'].includes(extension)) return translations.documents;
    return translations.other;
}

// Локализованное уведомление
function showNotification(titleKey, bodyKey, bodyArg) {
    const title = translations[titleKey] || titleKey;
    const body = `${translations[bodyKey] || bodyKey} ${bodyArg}`;
    new Notification({ title, body }).show();
}