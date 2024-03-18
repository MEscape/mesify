import axios from 'axios';
import RNFetchBlob from 'rn-fetch-blob';
import { FIREBASE_FIRESTORE } from './FirebaseConfig';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const firestore = FIREBASE_FIRESTORE;
const safedUser = require("./global").safedUser;

const fetchHTML = async (url) => {
  const response = await RNFetchBlob.fetch('GET', url);
  return response.text();
};

export async function ytsearch(query) {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    const html = await fetchHTML(url);
    let regex = /<script[^>]*>\s*var\s+ytInitialData\s*=\s*(.*?)\s*<\/script>/i;
    let match = html.match(regex);
    const json = JSON.parse(match[1].slice(0, -1));
    const videoArea = json.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0];
    const contents = videoArea.itemSectionRenderer.contents;

    return contents.map((content) => {
      if(content.videoRenderer) {
        const video = content.videoRenderer
        if(video && video.title) {
          const title = video.title.runs[0].text;
          const id = video.videoId;
          const bestImg = video.thumbnail.thumbnails.length -1;
          const artwork = video.thumbnail.thumbnails[bestImg].url;
          const artist = video.ownerText.runs[0].text;
          console.log(artist, title, artwork, id);

          if(title && id && artwork && artist)
            return {title: title, id: id, artwork: artwork, artist: artist}
        }
      }
    }).filter(Boolean);
  } catch(err) {
    console.error('ytsearch', err);
  }
}

export async function ytsuggestion(id) {
  try {
    const url = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
    const html = await fetchHTML(url);
    let regex = /<script[^>]*>\s*var\s+ytInitialData\s*=\s*(.*?)\s*<\/script>/i;
    let match = html.match(regex);
    const json = JSON.parse(match[1].slice(0, -1));
    const videoArea = json.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results;
    
    return videoArea.map((renderItem) => {
      if(renderItem.compactVideoRenderer) {
        const video = renderItem.compactVideoRenderer
        if(video.title) {
          const title = video.title.simpleText;
          const id = video.videoId;
          const bestImg = video.thumbnail.thumbnails.length -1;
          const artwork = video.thumbnail.thumbnails[bestImg].url;
          let artist = video.accessibility.accessibilityData.label;
          const pattern = /Zum Kanal - (.*?) -/;
          const match = artist.match(pattern);
          artist = match[1];

          console.log(title, id, artwork, artist)

          if(title && id && artwork && artist)
            return {title: title, id: id, artwork: artwork, artist: artist}
        }
      }
    }).filter(Boolean);
  } catch(e) {
    console.error(e);
  }
}

export async function yttrend() {
  const url = `https://www.youtube.com/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ`;
  const html = await fetchHTML(url);
  console.log(html)
  let regex = /<script[^>]*>\s*var\s+ytInitialData\s*=\s*(.*?)\s*<\/script>/i;
  let match = html.match(regex);
  const json = JSON.parse(match[1].slice(0, -1));

  console.log(json)
}

const openaiApiCall = async (prompt) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        messages: [
          {role: 'system', content: prompt.system},
          {role: 'user', content: prompt.user}
        ],
        max_tokens: 500,
        model: 'gpt-3.5-turbo'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer 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`,
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(error);
  }
}

async function getTracks() {
  let currentTracks = ''
  let mostPlayedTracks = ''

  try {
      const likedCollection = collection(firestore, 'user', safedUser.uid, 'like');
      const current = query(likedCollection, orderBy('createdAt', 'desc'), limit(20));
      const querySnapshotCurrent = await getDocs(current);
      querySnapshotCurrent.docs.forEach(doc => {
          currentTracks += doc.data().title + ', '
      });

      const mostPlayed = query(likedCollection, orderBy('playtime', 'desc'), limit(20));
      const querySnapshotMostPlayed = await getDocs(mostPlayed);
      querySnapshotMostPlayed.docs.forEach(doc => {
        mostPlayedTracks += doc.data().title + ', '
      });

  } catch (error) {
      console.log(error);
  }

  if(currentTracks.length > 0)
    currentTracks = 'Aktuelle Lieblingssong: ' + currentTracks
    
  if(mostPlayedTracks.length > 0)
    mostPlayedTracks = 'Meist gehöhrte Songs diesen Monat: ' + mostPlayedTracks

  return {currentTracks: currentTracks, mostPlayedTracks: mostPlayedTracks}
}

async function getGenres() {
  let genres = ''
  let notGenres = ''

  try {
    const user = doc(firestore, 'user', safedUser.uid);
    const snapshot = await getDoc(user);
    genres = snapshot.data().genres.toString()
    notGenres = snapshot.data().notGenres.toString()
  } catch (error) {
      console.log(error);
  }

  if(genres.length > 0)
    genres = 'Bevorzugte Genres: ' + genres
  
  if(notGenres.length > 0)
    notGenres = 'Nicht bevorzugte Genres: ' + notGenres


  return {prefered: genres, not: notGenres}
}

async function getTemplateData(topArtists) {
  let artists = ''

  topArtists.forEach(artist => {
    artists += artist.name + ', '
  })

  if(artists.length > 0)
    artists = 'Lieblings Künstler: ' + artists
  
  const tracks = await getTracks()
  const genres = await getGenres()

  return {
    artists: artists, 
    currentTracks: tracks.currentTracks, 
    mostPlayedTracks: tracks.mostPlayedTracks,
    genres: genres.prefered,
    notGenres: genres.not
  }
}

export async function setupPreferences(topArtists) {
  const templateData = await getTemplateData(topArtists)

  const template = {
    user: `Musikgeschmack:
    ${templateData.currentTracks}
    
    ${templateData.mostPlayedTracks}

    ${templateData.artists}
    
    ${templateData.genres}
    
    ${templateData.notGenres}
    
    Bassierend auf diesem Video geschmack sollst du 10 weitere Lieder auf Youtube finden
    die mir gefallen könnten. Lasse dir Zeit und Analysiere meinen Musik geschmack, damit
    möglichst gute Ergebnisse raus kommen. Achte darauf das du mir nur Songs nennst, welche wirklich 
    existieren. Halte deine Antwort kurz gebe mir nur jeweils den Titel an.
    Schreibe den Titel des Songs immer zwischen $&. Also wie folgt: $&Titel$&
    `,
    system: `Du arbeitest bei Spotify und suchst stetig neue Songs für User, die ihnen gefallen.`
  };

  let response = await openaiApiCall(template);
  if(response) {
    response = response.match(/\$&(.*?)\$&/g).map(function(val){
      return val.replace(/\$&/g,'');
    });

    response.forEach(async (song) => {
      try {
        let response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${song}&type=video&maxResults=1&key=AIzaSyDjvrqw9eY8fBTOQkyUCccXY5pzHIURSqU`)
        let json = await response.json()
        
        if(json && !('error' in json)) {
          let video = json.items[0]
          const id = video.id.videoId
          const title = video.snippet.title
          const artist = video.snippet.channelTitle
          const artwork = video.snippet.thumbnails.medium.url
    
          video =  { timestamp: new Date(), title: title, creator: artist, cover: artwork }

          const preferences = doc(firestore, 'user', safedUser.uid, 'preferences', id);
          await setDoc(preferences, video);
        } else {
          let json = (await ytsearch(song))[0]

    
          if(json) {
            const id = json.id
            const title = json.title
            const artist = json.artist
            const artwork = json.artwork
    
            video =  { timestamp: new Date(), title: title, creator: artist, cover: artwork }
          
            const preferences = doc(firestore, 'user', safedUser.uid, 'preferences', id);
            await setDoc(preferences, video);
          }
        }
      } catch(error) {
        console.log(error);
      }
    })
  }
}

export const deleteOldPreferences = async (json) => {
  try {
    const preferencesCollection = collection(firestore, 'user', json.uid, 'preferences')
    const querySnapshot = await getDocs(preferencesCollection);

    for(documentPath of querySnapshot.docs) {
      await deleteDoc(documentPath.ref);
    }
    
  } catch (error) {
    console.error(error);
  }
}