const folderInfo = document.getElementById('folder-info');
const selectFolderButton = document.getElementById('select-folder');
const stopWatchingButton = document.getElementById('stop-watching');

stopWatchingButton.addEventListener('click', () => {
    ipcRenderer.send('stop-watching');
    folderInfo.textContent = 'No folder selected.';
    stopWatchingButton.disabled = true;
});

ipcRenderer.on('translations-updated', (event, translations) => {
    // Обновляем текстовые элементы на странице
    document.title = translations.title || document.title;
    document.getElementById('select-folder').textContent = translations.selectFolder || 'Select Folder';
    document.getElementById('stop-watching').textContent = translations.stopWatching || 'Stop Watching';
    document.getElementById('folder-info').textContent = translations.noFolderSelected || 'No folder selected.';
});
selectFolderButton.addEventListener('click', async () => {
    try {
        const folderPath = await ipcRenderer.invoke('select-folder'); // Ожидаем результат
        if (folderPath) {
            folderInfo.textContent = `Watching folder: ${folderPath}`; // Обновляем интерфейс
            stopWatchingButton.disabled = false;
        } else {
            folderInfo.textContent = 'No folder selected.';
        }
    } catch (error) {
        console.error('Error selecting folder:', error);
    }
});


