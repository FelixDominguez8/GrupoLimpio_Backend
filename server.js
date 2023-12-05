//RECORDA USAR UN .ENV AL FINAL, para la llave de firebase y el url del backend hosteado!!!!
//Encryptar contraseña en el frontend

const cors = require('cors');
const bodyParser = require('body-parser');
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, 
    updateEmail, updatePassword, sendEmailVerification, sendPasswordResetEmail} = require('firebase/auth');
const { getStorage, ref,getDownloadURL, uploadBytesResumable, uploadBytes, uploadString} = require('firebase/storage');
const express = require("express");
const multer = require("multer");

const puerto=3001;

const app = express();

app.use(cors());

app.use(express.static('public'));

const admin = require("firebase-admin");
const credentials = require("./key.json");

admin.initializeApp({
    credential: admin.credential.cert(credentials)
});

const db = admin.firestore();

app.use(express.json({limit:'25mb'}));

app.use(express.urlencoded({limit:"25mb",extended: true}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.listen(puerto,()=>{
    console.log("Servidor funcionando en el puerto",puerto);
});

const firebaseConfig = {
    apiKey: "AIzaSyB1ea9pqCb43ueuVDaGCNmpumAJ27sdZ8s",
    authDomain: "grupolimpio-7b7cf.firebaseapp.com",
    projectId: "grupolimpio-7b7cf",
    storageBucket: "grupolimpio-7b7cf.appspot.com",
    messagingSenderId: "213401898380",
    appId: "1:213401898380:web:29b35eebd8a1062be29aa9",
    measurementId: "G-W01RBP4RJT"
};

const appFirebase = initializeApp(firebaseConfig);

app.post('/create', async (req, res) =>{
    try{
        const userJson = {
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName
        };
        const response = db.collection("infousuario").add(userJson);
        res.send(response);
    }catch(error){
        res.send(error);
    }
})

app.get('/read/all', async (req, res) => {
    try{
        const userRef = db.collection("infousuario");
        const response = await userRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.send(responseArr);
    } catch(error) {
        res.send(error);
    }
})

app.get('/read/:id', async (req, res) => {
    try{
        const userRef = db.collection("infousuario").doc(req.params.id);
        const response = await userRef.get();
        res.send(response.data());
    } catch(error) {
        res.send(error);
    }
})

app.post('/update', async(req, res) =>{
    try{
        const id=req.body.id;
        const newFirstName = "hello world!";
        const userRef = await db.collection("infousuario").doc(id)
        .update({
            firstName: newFirstName
        });
        const response = await userRef.get();
        res.send(response.data())

    }catch(error){
        res.send(error);
    }
})

app.post('/registrar', (req, res) =>{
    const {parcel} = req.body
    if(!parcel){
        return res.status(400).send({status: 'failed'});
    }
    res.status(200).send({status: 'recieved'});
})

app.post('/submit', (req, res) => {
    try{
        const id = req.body.correo;
        const RegistroData = req.body;
        console.log('Data received from frontend:', RegistroData);  
        const response = db.collection("infousuario").doc(id).set(RegistroData);
        res.send(response);
    }catch(error){
        res.send(error);
    }
});

app.post("/createUser", (req,res) => {
    const correo = req.body.correo;
    const password = req.body.password;
    const auth = getAuth();
    createUserWithEmailAndPassword(auth, correo, password)
    .then((userCredential) => {
        const user = userCredential.user;
        res.status(200).send({
            "msg":"creado existosamente",
            "data":userCredential
        })
        const auth = getAuth();
        sendEmailVerification(auth.currentUser)
        .then(() => {
            console.log("Se ha enviado un correo de verfiicacion a su correo")
        });
    })
    .catch((error) =>{
        const errorCode = error.code;
        const errorMessage = error.message;
        res.status(500).send({
            "Error":error.code
        })
    })
})

app.post("/logIn",(req,res)=>{
    const auth = getAuth();
    const correo = req.body.correo
    const password = req.body.password
    signInWithEmailAndPassword(auth, correo, password)
    .then((userCredential) => {
        const user = userCredential.user;
        const responseData = { message: 'Holas'};
        res.json(responseData);
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorMessage);
        res.status(500).send({
            "msg":"Credenciales incorrectas",
            "data":error.name
        })
    });
});

app.post('/CargarPerfil', async (req, res) => {
    try{
        const userRef = db.collection("infousuario").doc(req.body.id);
        const response = await userRef.get();
        console.log(response.data());
        res.send(response.data());
    } catch(error) {
        res.send(error);
    }
})

app.post('/CargarPerfilAdmin', async (req, res) => {
    try{
        const userRef = db.collection("infoadmin").doc(req.body.id);
        const response = await userRef.get();
        console.log(response.data());
        res.send(response.data());
    } catch(error) {
        res.send(error);
    }
})

app.post('/Actualizar', async(req, res) =>{
    try{
        const correo=req.body.correo;
        const userRef = await db.collection("infousuario").doc(correo)
        .update({
            nombre: req.body.nombre,
            apellido: req.body.apellido,
            id: req.body.id,
            telefono: req.body.telefono,
            ciudad: req.body.ciudad,
            fechanacimiento: req.body.fechanacimiento,
            genero: req.body.genero,
            direccion: req.body.direccion
        });
        const response = await userRef.get();
        res.send(response.data())

    }catch(error){
        res.send(error);
    }
})

app.post("/ConfirmPassword", async(req,res)=>{
    try{
        const userRef = db.collection("infousuario").doc(req.body.correo);
        const response = await userRef.get();
        res.send(response.data());
    } catch(error) {
        res.send(error);
    }
})

app.post("/updatePassword", async(req,res)=>{
    const auth = getAuth();
    const user = auth.currentUser;
    await db.collection("infousuario").doc(req.body.correo)
        .update({
            password: req.body.password
        });
    
    updatePassword(user, req.body.password).then(() => {
        res.status(200).send({
            "msj":"contraseña actualizada",
        })
    }).catch((error) => {
        res.status(500).send({
            "msj":"error actualizando la contraseña"
        })
    });
})

app.post("/restorePassword", async(req,res) =>{
    const auth = getAuth();
    console.log(req.body.correo);
    console.log("Hola");
    sendPasswordResetEmail(auth, req.body.correo)
    .then(() => {
        res.status(200).send({
            "msg":"Todo bien",
        });
        console.log("Correo enviado");
    })
    .catch((error) => {
        res.status(500).send({
            "msg":"Todo mal",
        });
        console.log("Hola2");
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorMessage);
    });
})

app.get("/logOut",(req,res)=>{
    const auth = getAuth();
    signOut(auth).then(()=>{
        res.status(200).send({
            "msg":"log out",
        })
    }).catch((error) => {
        res.status(500).send({
            "msg":"error log out",
            "data":error
        })
    })
})

app.post('/readAdmin', async (req, res) => {
    try{
        const userRef = db.collection("infoadmin").doc(req.body.correo);
        const response = await userRef.get();
        console.log(response.data());
        res.send(response.data());
    } catch(error) {
        res.send(error);
    }
})

app.post('/subirImagen', async (req,res) =>{
    try{
        const storage = getStorage();
        console.log(req.body.imagen);
        const imagenRef = ref(storage, 'productos/A');
            uploadString(imagenRef, req.body.imagen,'data_url').then((snapshot) => {
            console.log('Uploaded a raw string!');
        });
        // uploadBytes(imagenRef, req.body).then(() => {
        //     console.log('Imagen subida');
        // });

    } catch(error){
        res.send(error)
        console.log('D: D:'+error)
    }
})

app.post('/submitProducto', (req, res) => {
    try{
        const id = req.body.nombre;
        const RegistroData = req.body;
        console.log('Data received from frontend:', RegistroData);  
        const response = db.collection("producto").doc(id).set(RegistroData);
        res.send(response);
    }catch(error){
        res.send(error);
    }
});

app.get('/selectProductos', async (req, res) => {
    try{
        const userRef = db.collection("producto");
        const response = await userRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.send(responseArr);
    } catch(error) {
        res.send(error);
    }
})

app.post('/ActualizarProducto', async(req, res) =>{
    try{
        const nombre=req.body.nombre;
        const userRef = await db.collection("producto").doc(nombre)
        .update({
            nombre: req.body.nombre,
            categoria: req.body.categoria,
            marca: req.body.marca,
            imagen: req.body.imagen,
            precio: req.body.precio,
            cantidad: req.body.cantidad,
        });
        const response = await userRef.get();
        res.send(response.data())
    }catch(error){
        console.log("Malo"+error)
        res.send(error);
    }
})

app.post('/EliminarProducto', async(req, res) =>{
    try{
        const response = await db.collection("producto").doc(req.body.nombre).delete();
        res.send(response.data())
    }catch(error){
        console.log("Malo:D"+error)
        res.send(error);
    }
})
