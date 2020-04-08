import * as firebase from 'firebase'
import 'firebase/auth'
import firebaseConfig from './firebaseConfig'
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig); }

const Firebase = {

   // auth
  loginWithEmail: (email, password) => {
    return firebase.auth().signInWithEmailAndPassword(email, password)
  },
  signupWithEmail: (email, password) => {
    return firebase.auth().createUserWithEmailAndPassword(email, password)
  },
  signOut: () => {
    return firebase.auth().signOut()
  },
  checkUserAuth: user => {
    return firebase.auth().onAuthStateChanged(user)
  },
  passwordReset: email => {
    return firebase.auth().sendPasswordResetEmail(email)
  },
  createNewUser: userData =>{
    var ref =firebase.database().ref('users/' + `${userData.uid}`);

    const BOT_USER = {
       _id: 2,
       name: 'escapism bot',
     };


    ref.set(userData).then((data)=>{
        console.log('data ' , data)
    }).catch((error)=>{
        console.log('error ' , error)
    });
    ref.child("text").set({
        textEmo: {
     sad: 1,
     angry: 1,
     happy:1,
     fear :1,
     excited:1,
     indifferent:1
   }
     });
    var ts = firebase.database.ServerValue.TIMESTAMP;
   var name =userData.name;
   const msg=
   { _id:1,
     text: `hi ${userData.name} this is escapism we are here for you feel free talk to me`,
     createdAt: ts,
     user: BOT_USER,
   };


    return ref.child('chat').push(msg);


},

getUserDetails: () => {
   let user = firebase.auth().currentUser
     var userid= user.uid;
     var ref = firebase.database().ref('users/').child(`${userid}`);

       return ref.once('value').then((snapshot) => {
       var name = snapshot.child("name").val();
       var email = snapshot.child("email").val();
       var uri = snapshot.child("avatar").val();
       var uid = snapshot.child("uid").val();


       var arr =[name,email,uri,uid];
       return arr;
     }).catch(function(error) {
       console.log( error)
     })
 },

  uploadAvatar:async (avatarImage) => {
    let user = firebase.auth().currentUser
   var userid= user.uid;
      const response = await fetch(avatarImage);
     const blob = await response.blob();

     var ref = firebase.storage().ref().child("userPic/" + `${userid}`);
     const snapshot = await ref.put(blob);
    var image = await snapshot.ref.getDownloadURL();
    var ref = firebase.database().ref('users/').child(`${userid}`);
    return ref.update( {avatar: image});
    },




     fetchChat: ()=> {
       let user = firebase.auth().currentUser
         var userid= user.uid;
         if(user){
         var ref = firebase.database().ref('users/' + `${userid}`).child('chat');
           return ref.once('value').then((snapshot) => {
         const chatObject = snapshot.val();


        let chatList = Object.keys(chatObject).map(key => ({
         ...chatObject[key],
       }));


          return chatList.reverse();
         }).catch(function(error) {
           console.log( error)
         })
       }

  },

pushMessage: message  =>{
     let user = firebase.auth().currentUser;
     var userid= user.uid;
      var ts = firebase.database.ServerValue.TIMESTAMP;
      var ref = firebase.database().ref('users/' + `${userid}`);
     ref.child('chat').push(
       {
         _id:message._id,
         text: message.text,
         createdAt: ts,
         user:message.user
       }
     ).then((data)=>{
     }).catch((error)=>{
         console.log('error ' , error)
     })

    },

    uploadVideo: async (uri) => {
    let user = firebase.auth().currentUser
    var userid= user.uid;
    const response = await fetch(uri);
    const blob = await response.blob();
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      let base64 = reader.result;
    };
    var name="123"+Date.now();
    var ref = firebase.storage().ref("videos/" + name).child(`${userid}`);
    const result2 = await ref.put(blob)
    const downloadURL = await result2.ref.getDownloadURL();
    console.log(downloadURL);
    return result2;
  },

  uploadImage: async (Image) => {
    let user = firebase.auth().currentUser
    const response = await fetch(Image);
    const blob = await response.blob();
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      let base64 = reader.result;
      //console.log(base64);
    };
    var name="123"+Date.now();
    var ref = firebase.storage().ref().child("userPic/" + name);
    const snapshot = await ref.put(blob);
    var image = await snapshot.ref.getDownloadURL();
    console.log(image);
    const axios = require("axios");
        axios({
          "method":"POST",
          "url":"https://luxand-cloud-face-recognition.p.rapidapi.com/photo/emotions",
          "headers":{
          "content-type":"application/x-www-form-urlencoded",
          "x-rapidapi-host":"luxand-cloud-face-recognition.p.rapidapi.com",
          "x-rapidapi-key":"cc81abd375msh1b00401b78cef11p11f09fjsn6fb16a44c153"
          },"params":{
          "photo":image
          },"data":{

          }
          })
          .then((response)=>{
            const selection = ["disgust","sadness", "anger","happiness","contempt","surprise","neutral"]
            const emotion = response.data.faces[0].emotions
            for (i=0;i<=selection.length;i++){
              if(emotion[selection[i]]>=0.5)
              console.log(selection[i])
              //this.textApi(selection[i])
            }
          })
          .catch((error)=>{
            console.log(error)
          })
    //var ref = firebase.database().ref('users/').child(name);
    return image;
    //ref.off();
    },

  textApi: (text) => {
  let user = firebase.auth().currentUser
    var userid= user.uid;
    var ref = firebase.database().ref('users/' + `${userid}` ).child("text");
    ref.push(text);
 },
 maxEmo: (emoitions) => {
   let emotionss = emoitions;
      let emoition = Object.keys(emotionss).reduce((a, b) => emotionss[a] > emotionss[b] ? a : b);
      firebase.database().ref('textEmo').set(emoition)
},
 saveEmo: async (emo) => {
   let user = firebase.auth().currentUser
     var userid= user.uid;
     var ref = firebase.database().ref('users/' + `${userid}`).child("text");
  ref.child("textEmo").transaction((data) => {
       if(data) {
         switch(emo) {
         case "sad":
           if(data.sad) {
               data.sad++;}
           break;
           case "happy":
           if(data.happy) {
               data.happy++;}
            break;

            case "angry":
              if(data.angry) {
                  data.angry++;}
              break;
              case "fear":
              if(data.fear) {
                  data.fear++;}
               break;

               case "excited":
                 if(data.excited) {
                     data.excited++;}
                 break;
                 case "indifferent":
                 if(data.indifferent) {
                     data.indifferent++;}
                  break;

          }

       }
       let emotions = data;
       let emoition = Object.keys(emotions).reduce((a, b) => emotions[a] > emotions[b] ? a : b);
       firebase.database().ref('textEmo').set(emoition);
       return data;

  })
  .then(console.log('Done'))
  .catch((error) => console.log(error));
 },

    }

export default Firebase
