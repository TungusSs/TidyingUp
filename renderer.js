/**
 * DOM Elements
 * Элементы DOM
 */
const folderInfo = document.getElementById('folder-info');
const selectFolderButton = document.getElementById('select-folder');
const stopWatchingButton = document.getElementById('stop-watching');

/**
 * Stop watching folder handler
 * Обработчик остановки наблюдения за папкой
 */
stopWatchingButton.addEventListener('click', () => {
    ipcRenderer.send('stop-watching');
    folderInfo.textContent = 'No folder selected.';
    stopWatchingButton.disabled = true;
});

/**
 * Handle translations updates from main process
 * Обработка обновлений переводов из главного процесса
 * @param {Event} event - IPC event object
 * @param {Object} translations - Translation key-value pairs
 */
ipcRenderer.on('translations-updated', (event, translations) => {
    document.title = translations.title || document.title;
    document.getElementById('select-folder').textContent = translations.selectFolder || 'Select Folder';
    document.getElementById('stop-watching').textContent = translations.stopWatching || 'Stop Watching';
    document.getElementById('folder-info').textContent = translations.noFolderSelected || 'No folder selected.';
});

/**
 * Handle folder selection and start watching
 * Обработка выбора папки и начало наблюдения
 */
selectFolderButton.addEventListener('click', async () => {
    try {
        const folderPath = await ipcRenderer.invoke('select-folder');
        if (folderPath) {
            folderInfo.textContent = `Watching folder: ${folderPath}`;
            stopWatchingButton.disabled = false;
        } else {
            folderInfo.textContent = 'No folder selected.';
        }
    } catch (error) {
        console.error('Error selecting folder:', error);
    }
});
