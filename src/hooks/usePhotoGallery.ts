import { useState, useEffect } from "react";
import { isPlatform } from "@ionic/react";

import { Camera, CameraResultType, CameraSource, Photo } from "@capacitor/camera"
import { Filesystem, Directory } from "@capacitor/filesystem"
import { Storage } from "@capacitor/storage"
import { Capacitor } from "@capacitor/core"

const PHOTO_STORAGE = "photos"

export function usePhotoGallery() {

  // we store the photos returned from Capacitor in a state variable (array of Photo objects)
  const [photos, setPhotos] = useState<UserPhoto[]>([])

  // we use useEffect to load the photos from the web device's storage
  useEffect(() => {
    const loadSaved = async () => {
      const { value } = await Storage.get({ key: PHOTO_STORAGE })

      const photosInStorage = (value ? JSON.parse(value) : []) as UserPhoto[]

      // if running on the web:
      if (!isPlatform('hybrid')) {
        for (let photo of photosInStorage) {
          const file = await Filesystem.readFile({ path: photo.filepath, directory: Directory.Data })

          // in webplatform we need to convert the file to a base64 string
          photo.webviewPath = `data:image/jpeg;base64,${file.data}`
        }
      }
      setPhotos(photosInStorage)
    }
    loadSaved()
  }, [])


  const takePhoto = async () => {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    })

    const fileName = new Date().getTime() + '.jpeg'
    // here we define the filename and the directory to store the photo, then 
    // we use setPhotos to add the photo to the state variable
    const savedFileImage = await savePicture(photo, fileName)
    const newPhotos = [savedFileImage, ...photos]
    setPhotos(newPhotos)

    // here we save the photo to the storage
    Storage.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) })
  }


  const savePicture = async (photo: Photo, fileName: string): Promise<UserPhoto> => {
    let base64Data: string

    // hybrid will detect cordova or capacitor (mobile)
    if (isPlatform('hybrid')) {
      const file = await Filesystem.readFile({ path: photo.path! })
      base64Data = file.data
    } else {
      base64Data = await base64FromPath(photo.webPath!)
    }

    // here we define the filename, data and the directory to store the photo
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    })

    if (isPlatform('hybrid')) {
      // Display the new image by rewriting the 'file://' path to HTTP
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri)
      }
    } else {
      return {
        filepath: fileName,
        webviewPath: photo.webPath
      }
    }
  }

  const deletePhoto = async (photo: UserPhoto) => {

    // here we filter the photos array to remove the photo we want to delete
    const newPhotos = photos.filter((p) => p.filepath !== photo.filepath)

    // update photos array cache by overwriting the existing photos array
    Storage.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) })

    const filename = photo.filepath.substring(photo.filepath.lastIndexOf('/') + 1)
    await Filesystem.deleteFile({ path: filename, directory: Directory.Data })
    setPhotos(newPhotos)
  }

  return {
    takePhoto, photos, deletePhoto
  }
}


// The base64FromPath method is a helper util that downloads a file from the supplied path
//  and returns a base64 representation of that file.
export async function base64FromPath(path: string): Promise<string> {
  const response = await fetch(path)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject('Method did not return a string')
      }
    }
    reader.readAsDataURL(blob)
  })
}


// this interface will be used to represent photo's metadata
export interface UserPhoto {
  filepath: string,
  webviewPath?: string,
}