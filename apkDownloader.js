import RNFetchBlob from 'rn-fetch-blob';
import { unzip } from 'react-native-zip-archive';
import RNFS from 'react-native-fs';
import { Platform, PermissionsAndroid } from 'react-native';

const generateDestinationPath = async () => {
    let destPath = '';
  
    try {
      if (Platform.OS === 'ios') {
        // Für iOS kannst du den Documents-Ordner verwenden
        destPath = RNFetchBlob.fs.dirs.DocumentDir;
      } else if (Platform.OS === 'android') {
        // Für Android musst du möglicherweise die Berechtigung für den Zugriff auf den externen Speicher überprüfen
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          // Berechtigung erteilt, du kannst den Download-Ordner verwenden
          destPath = RNFetchBlob.fs.dirs.DownloadDir;
        } else {
          // Berechtigung nicht erteilt, verwende den Cache-Ordner als Alternative
          destPath = RNFetchBlob.fs.dirs.DocumentDir;
        }
      }
    } catch (error) {
      console.error('Error generating destination path:', error);
      // Verwende den Cache-Ordner als Fallback
      destPath = RNFetchBlob.fs.dirs.DocumentDir;
    }
  
    return destPath;
}

const installApk = async (apkPath) => {
  try {
    // Install the APK
    const result  = await RNFS.scanFile(apkPath);
    const success = result && !result.error;

    return success;
  } catch (error) {
    console.error('Error installing APK:', error);
    return false;
  }
};

export const downloadAndInstallApk = async (url) => {
  try {
    // Generate the destination path
    const destination = await generateDestinationPath();

    // Check if the destination directory exists
    const dirExists = await RNFS.exists(destination);
    if (!dirExists) {
      // Create the destination directory
      await RNFS.mkdir(destination);
    }

    // Download the .zip file
    const res = await RNFetchBlob.config({
      fileCache: true,
      appendExt: 'zip',
    }).fetch('GET', url);

    // Extract the .rar file
    await unzip(res.path(), destination);

    // Verify that the destination directory exists
    const isDirExist = await RNFS.exists(destination);
    if (!isDirExist) {
      throw new Error('Destination directory does not exist');
    }

    // Find the APK file in the extracted directory
    const files = await RNFS.readDir(destination);
    const apkFile = files.find((file) => file.name.endsWith('.apk'));
    if (!apkFile) {
      throw new Error('APK file not found in extracted directory');
    }

    // Install the APK
    const apkPath = apkFile.path;
    const apkInstalled = await installApk(apkPath);
    if (!apkInstalled) {
      throw new Error('Failed to install APK');
    }

    return apkPath;
  } catch (error) {
    // Handle errors
    console.error('Error downloading, extracting, installing APK, or uninstalling old app:', error);
    return false;
  }
};