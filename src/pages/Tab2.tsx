import { IonContent, IonHeader, IonFab, IonFabButton, IonIcon, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonImg, IonActionSheet } from '@ionic/react';
import { camera, close, trash } from 'ionicons/icons';
import { useState } from 'react';
import './Tab2.css';

import { usePhotoGallery, UserPhoto } from '../hooks/usePhotoGallery';

const Tab2: React.FC = () => {

  const [photoToDelete, setPhotoToDelete] = useState<UserPhoto>();

  const { takePhoto, photos, deletePhoto } = usePhotoGallery();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Photo Gallery</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonGrid>
          <IonRow>
            {photos.map((photo, index) => (
              <IonCol size='6' key={index}>
                <IonImg onClick={() => setPhotoToDelete(photo)} src={photo.webviewPath} />
                <IonActionSheet isOpen={!!photoToDelete} buttons={[{
                  text: 'Delete', role: 'destructive', icon: trash, handler() {
                    if (photoToDelete) {
                      deletePhoto(photoToDelete);
                      setPhotoToDelete(undefined);
                    }
                  },
                },
                {
                  text: 'Cancel',
                  icon: close,
                  role: 'cancel'
                }]}
                  onDidDismiss={() => setPhotoToDelete(undefined)} />
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
        <IonFab vertical='bottom' horizontal='center' slot='fixed'>
          <IonFabButton onClick={() => takePhoto()}>
            <IonIcon icon={camera} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
