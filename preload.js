const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose a limited set of IPC methods to the renderer process
 * Предоставляем ограниченный набор методов IPC для процесса рендеринга
 */
contextBridge.exposeInMainWorld('ipcRenderer', {
    /**
     * Invoke a channel with arguments and return a promise
     * Вызываем канал с аргументами и возвращаем промис
     * @param {string} channel - The channel to invoke
     * @param {...any} args - Arguments to pass to the channel
     * @returns {Promise<any>} - A promise that resolves with the result
     */
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

    /**
     * Send a message to a channel
     * Отправляем сообщение в канал
     * @param {string} channel - The channel to send the message to
     * @param {...any} args - Arguments to pass to the channel
     */
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),

    /**
     * Listen for messages from a channel
     * Слушаем сообщения из канала
     * @param {string} channel - The channel to listen to
     * @param {Function} listener - The callback function to handle messages
     */
    on: (channel, listener) => ipcRenderer.on(channel, listener)
});