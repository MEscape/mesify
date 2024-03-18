import ytdl from "react-native-ytdl"

export async function YtAction(videoId) {
    try {
        let info = await ytdl.getInfo(videoId);
        let audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        audioFormats.sort((a, b) => b.bitrate - a.bitrate);
        console.log(audioFormats[0].url);
        
        return audioFormats[0].url;
    } catch (error) {
        console.log(error, "ytaction")
    }
}