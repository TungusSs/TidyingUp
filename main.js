const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, Notification } = require('electron');
const fs = require('fs');
const path = require('path');
const { updateElectronApp } = require('update-electron-app');

// Running this as early in the main process as possible
// Запускаем это как можно раньше в основном процессе
if (require('electron-squirrel-startup')) app.quit();

updateElectronApp();

let mainWindow;
let tray;
let watcher = null;
let watchedFolder = null;
let currentLocale = 'en'; // Default language / Язык по умолчанию
let translations = loadTranslations(currentLocale); // Initialize translations / Инициализируем переводы

/**
 * Load translations from JSON
 * Загружаем переводы из JSON
 * @param {string} locale - The locale to load translations for
 * @returns {object} - The translations object
 */
function loadTranslations(locale) {
    const localePath = path.join(__dirname, 'locales', `${locale}.json`);
    if (fs.existsSync(localePath)) {
        return JSON.parse(fs.readFileSync(localePath, 'utf-8'));
    }
    console.error(`Translations for locale "${locale}" not found.`);
    return {};
}

/**
 * Create the main application window
 * Создаем главное окно приложения
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 500,
        height: 300,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        icon: path.join(__dirname, 'images/icon.ico'),
        maximizable: false,
    });

    mainWindow.loadFile('index.html');
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    createMenu(); // Create the application menu / Создаем меню приложения
    createTray(); // Create the system tray icon / Создаем значок в системном трее
}

/**
 * Create the application menu
 * Создаем меню приложения
 */
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
    Menu.setApplicationMenu(menu); // Set the application menu / Устанавливаем меню для всего приложения
}

/**
 * Change the application language
 * Изменение языка приложения
 * @param {string} locale - The new locale to set
 */
function changeLanguage(locale) {
    currentLocale = locale;
    translations = loadTranslations(currentLocale);
    mainWindow.webContents.send('translations-updated', translations); // Update text in renderer / Обновляем текст в рендерере
    createMenu(); // Update the menu / Обновляем меню
    if (tray) {
        createTray(); // Update tray text / Обновляем текст в трее
    }
}

/**
 * Create the system tray icon
 * Создаем значок в системном трее
 */
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

// Run the application
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

/**
 * Handle folder selection
 * Обработка выбора папки
 */
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

/**
 * Stop watching the folder
 * Остановка наблюдения за папкой
 */
ipcMain.on('stop-watching', () => {
    if (watcher) {
        watcher.close();
        watcher = null;
        watchedFolder = null;
    }
});

/**
 * Start watching a folder for changes
 * Начинаем наблюдение за изменениями в папке
 * @param {string} folderPath - The path of the folder to watch
 */
function startWatching(folderPath) {
    if (watcher) {
        watcher.close(); // Close previous watcher if exists / Закрываем предыдущий watcher, если он есть
    }

    watcher = fs.watch(folderPath, (eventType, fileName) => {
        if (eventType === 'rename' && fileName) {
            organizeDownloads(folderPath, fileName);
        }
    });
}

/**
 * Organize downloaded files into categories
 * Организация загруженных файлов по категориям
 * @param {string} folderPath - The path of the folder
 * @param {string} fileName - The name of the file
 */
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

/**
 * Get the category of a file based on its extension
 * Получаем категорию файла на основе его расширения
 * @param {string} fileName - The name of the file
 * @returns {string} - The category of the file
 */
function getFileCategory(fileName) {
    const extension = path.extname(fileName).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(extension)) return translations.images;
    if (['.mp4', '.mkv', '.avi', '.mov', '.wmv'].includes(extension)) return translations.videos;
    if (['.mp3', '.wav', '.aac', '.flac'].includes(extension)) return translations.music;
    if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(extension)) return translations.archives;
    if (['.doc', '.docx', '.pdf', '.txt', '.xlsx', '.pptx'].includes(extension)) return translations.documents;
    return translations.other;
}

/**
 * Show a localized notification
 * Показать локализованное уведомление
 * @param {string} titleKey - The key for the title translation
 * @param {string} bodyKey - The key for the body translation
 * @param {string} bodyArg - Additional argument for the body
 */
function showNotification(titleKey, bodyKey, bodyArg) {
    const title = translations[titleKey] || titleKey;
    const body = `${translations[bodyKey] || bodyKey} ${bodyArg}`;
    new Notification({ title, body }).show();
}