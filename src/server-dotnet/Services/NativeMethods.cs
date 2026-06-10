using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;

namespace PerfectWall.Server.Services
{
    /// <summary>
    /// P/Invoke surface for the few Windows APIs we need
    /// (<c>ShellExecute</c>, media keys, icon extraction, file
    /// dialog). Kept in one file so the COM imports do not pollute
    /// every consumer.
    /// </summary>
    internal static class NativeMethods
    {
        // -------------------------------------------------------------
        // ShellExecute / ShellExecuteEx — used by /api/dockbar/open
        // -------------------------------------------------------------

        [DllImport("shell32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        public static extern IntPtr ShellExecute(
            IntPtr hwnd,
            string lpOperation,
            string lpFile,
            string lpParameters,
            string lpDirectory,
            int nShowCmd);

        public const int SW_SHOW = 5;
        public const int SW_HIDE = 0;

        // -------------------------------------------------------------
        // keybd_event — used by /api/files/player/{action} to send
        // media-key VK codes
        // -------------------------------------------------------------

        [DllImport("user32.dll")]
        public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, IntPtr dwExtraInfo);

        public const byte VK_MEDIA_PLAY_PAUSE = 0xB3;
        public const byte VK_MEDIA_NEXT_TRACK = 0xB0;
        public const byte VK_MEDIA_PREV_TRACK = 0xB1;
        public const byte VK_MEDIA_STOP = 0xB2;
        public const uint KEYEVENTF_KEYUP = 0x0002;

        // -------------------------------------------------------------
        // SHGetFileInfo / ExtractIconEx — used by the icon
        // extractor. The PE-resource parser in
        // <see cref="IconExtractor"/> tries first and only falls
        // back to these for files like .lnk / .ico that do not
        // carry a PE header.
        // -------------------------------------------------------------

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        public struct SHFILEINFO
        {
            public IntPtr hIcon;
            public int iIcon;
            public uint dwAttributes;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)]
            public string szDisplayName;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 80)]
            public string szTypeName;
        }

        [DllImport("shell32.dll", CharSet = CharSet.Unicode, SetLastError = false)]
        public static extern IntPtr SHGetFileInfo(
            string pszPath,
            uint dwFileAttributes,
            ref SHFILEINFO psfi,
            uint cbFileInfo,
            uint uFlags);

        public const uint SHGFI_ICON = 0x000000100;
        public const uint SHGFI_LARGEICON = 0x000000000;
        public const uint SHGFI_ADDOVERLAYS = 0x000000020;

        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool DestroyIcon(IntPtr hIcon);

        // -------------------------------------------------------------
        // IFileOpenDialog — used by /api/dockbar/select-file
        // -------------------------------------------------------------

        // The COM IIDs / CLSIDs for the Vista file dialog live in
        // shell32 / ole32; the .NET Framework 4.8 BCL does not
        // expose them. We keep the selection dialog out of this
        // build and use a much simpler fallback: a Win32
        // GetOpenFileName via comdlg32. That keeps the EXE
        // small and avoids the IFileOpenDialog interop mess.
        // -------------------------------------------------------------

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        public struct OPENFILENAME
        {
            public int lStructSize;
            public IntPtr hwndOwner;
            public IntPtr hInstance;
            public string lpstrFilter;
            public string lpstrCustomFilter;
            public int nMaxCustFilter;
            public int nFilterIndex;
            public string lpstrFile;
            public int nMaxFile;
            public string lpstrFileTitle;
            public int nMaxFileTitle;
            public string lpstrInitialDir;
            public string lpstrTitle;
            public int Flags;
            public short nFileOffset;
            public short nFileExtension;
            public string lpstrDefExt;
            public IntPtr lCustData;
            public IntPtr lpfnHook;
            public string lpTemplateName;
        }

        [DllImport("comdlg32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        public static extern bool GetOpenFileName(ref OPENFILENAME ofn);

        [DllImport("comdlg32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        public static extern bool GetSaveFileName(ref OPENFILENAME ofn);

        public const int OFN_FILEMUSTEXIST = 0x00001000;
        public const int OFN_PATHMUSTEXIST = 0x00000800;
        public const int OFN_EXPLORER = 0x00080000;
        public const int OFN_NOCHANGEDIR = 0x00000008;

        public static bool ShowOpenDialog(string title, out string filePath, string filter = "All files (*.*)\0*.*\0")
        {
            filePath = null;
            var ofn = new OPENFILENAME();
            var fileBuffer = new StringBuilder(260);
            ofn.lStructSize = Marshal.SizeOf(typeof(OPENFILENAME));
            ofn.lpstrFilter = filter;
            ofn.lpstrFile = fileBuffer.ToString();
            ofn.nMaxFile = fileBuffer.Capacity;
            ofn.lpstrTitle = title;
            ofn.Flags = OFN_FILEMUSTEXIST | OFN_PATHMUSTEXIST | OFN_EXPLORER | OFN_NOCHANGEDIR;
            if (GetOpenFileName(ref ofn))
            {
                filePath = fileBuffer.ToString();
                return true;
            }
            return false;
        }
    }
}
