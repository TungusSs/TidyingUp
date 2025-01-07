# 📂 TidyingUp

TidyingUp is a convenient Electron-based application for automatically sorting and cleaning the contents of your folders. Select a folder to monitor, and the app will track new files, automatically sort them into categories! 🚀

---

## 📋 Features

- **Automatic file sorting**: Files are moved into corresponding folders (e.g., Images, Videos, Music).
- **Background operation**: The app continues to work even after the main window is closed, with an icon in the system tray.
- **Language support**: Supports English 🇺🇸 and Russian 🇷🇺.
- **User-friendly interface**: Select folders, manage monitoring, and receive notifications with a single click.
- **Customizable menu**: Change the language directly from the app menu.

---

## 🛠️ Installation

1. Make sure you have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.
2. Clone the repository:
   ```bash
   git clone https://github.com/your-username/folder-cleaner.git
   ```
3. Navigate to the project folder:
   ```bash
   cd folder-cleaner
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run the app:
   ```bash
   npm start
   ```

---

## 📦 Building the Application

To build an executable file, run the following command:

```bash
npm run build
```

After completion, the `build` command will create a folder with executables for your operating system.

---

## 🌐 Supported Languages

The app supports two languages:

- 🇺🇸 English (default)
- 🇷🇺 Russian

You can switch the language via the `Language` menu.

---

## 📂 File Categories

The app automatically sorts files into the following categories:

- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`
- **Videos**: `.mp4`, `.mkv`, `.avi`, `.mov`, `.wmv`
- **Music**: `.mp3`, `.wav`, `.aac`, `.flac`
- **Archives**: `.zip`, `.rar`, `.7z`, `.tar`, `.gz`
- **Documents**: `.doc`, `.docx`, `.pdf`, `.txt`, `.xlsx`, `.pptx`
- **Others**: All other files

---

## 📖 Usage

1. **Select a folder**: Click the "Select Folder" button or use the app menu.
2. **Start monitoring**: The app will start tracking changes in the selected folder.
3. **Stop monitoring**: You can stop monitoring by selecting "Stop Watching" in the menu.
4. **Background operation**: The tray icon allows quick access to open or exit the app.
5. **Change language**: Switch the language via the `Language` menu.

---

## 🛡️ Requirements

- Node.js 16+
- Electron 25+

---

## 💡 Tips

- Ensure you have write permissions for the selected folder for optimal performance.

---

## 🖼️ Screenshots

![Main Window](/docs/MainApp.png)

---

## 🤝 Contributions

Want to contribute? We'd love your PRs! Just fork the repository and submit your pull request. 🙌

---

## 📧 Feedback

If you have any questions or suggestions, create issues.

---

## ⚖️ License

This project is licensed under the [MIT License](LICENSE).

---

## ⭐ Acknowledgments

- Electron — for their amazing framework.
- OpenAI — for inspiration.

---

**📂 Simplify your life with TidyingUp today!** 🎉
