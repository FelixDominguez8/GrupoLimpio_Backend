//RECORDA USAR UN .ENV AL FINAL, para la llave de firebase y el url del backend hosteado!!!!
//Encryptar contraseña en el frontend

const cors = require('cors');
const bodyParser = require('body-parser');
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, 
    updateEmail, updatePassword, sendEmailVerification, sendPasswordResetEmail, deleteUser} = require('firebase/auth');
const { getStorage, ref,getDownloadURL, uploadBytesResumable, uploadBytes, uploadString} = require('firebase/storage');
const express = require("express");
const multer = require("multer");

const stripe = require('stripe')('sk_test_51OltjaF3zNKFoJUZnZH320rqGnFagNjozO0TwginLT2l3UX8rVulX8vi3SapT9C9049YtEgi5yUmiX6yPkA6PBB300pWFV3yO8');

const puerto=3001;
const YOUR_DOMAIN = 'https://grupolimpio-7b7cf.web.app';

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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
        const response = db.collection("infousuario").doc(id).set(RegistroData);
        res.send(response);
    }catch(error){
        res.send(error);
        console.log(error);
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
        console.log(auth.currentUser);
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
        res.send(response.data());
    } catch(error) {
        res.send(error);
    }
})

app.post('/CargarPerfilAdmin', async (req, res) => {
    try{
        const userRef = db.collection("infoadmin").doc(req.body.id);
        const response = await userRef.get();
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
            fechanacimiento: req.body.fechanacimiento,
            genero: req.body.genero,
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
    console.log(user);
    await db.collection("infousuario").doc(req.body.correo)
        .update({
            password: req.body.password
        });
    
    updatePassword(user, req.body.password).then(() => {
        console.log("Contra");
        res.status(200).send({
            "msj":"contraseña actualizada",
        })
    }).catch((error) => {
        console.log(error);
        res.status(500).send({
            "msj":"error actualizando la contraseña"
        })
    });
})

app.post("/restorePassword", async(req,res) =>{
    const auth = getAuth();
    sendPasswordResetEmail(auth, req.body.correo)
    .then(() => {
        res.status(200).send({
            "msg":"Todo bien",
        });
    })
    .catch((error) => {
        res.status(500).send({
            "msg":"Todo mal",
        });
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorMessage);
    });
})

app.get("/logOut",(req,res)=>{
    const auth = getAuth();
    console.log(auth.currentUser);
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
        res.send(response.data());
    } catch(error) {
        res.send(error);
    }
})

app.post('/subirImagen', async (req,res) =>{
    try{
        const storage = getStorage();
        const imagenRef = ref(storage, 'productos/A');
            uploadString(imagenRef, req.body.imagen,'data_url').then((snapshot) => {
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
        const RegistroData = req.body;
        const response = db.collection("producto").doc();
        const idfb = response.id;
        RegistroData.id = idfb;
        response.set(RegistroData);
        res.send(RegistroData);
    }catch(error){
        res.send(error);
        console.log(error);
    }
});

//error agregando id cuando la coleccion esta vacia

app.post('/submitServicio', (req, res) => {
    try{
        const RegistroData = req.body;
        const response = db.collection("servicio").doc();
        const idfb = response.id;
        RegistroData.id = idfb;
        response.set(RegistroData);
        res.send(RegistroData);
    }catch(error){
        res.send(error);
        console.log(error);
    }
});

app.get('/selectServicios', async (req, res) => {
    try{
        const userRef = db.collection("servicio");
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

app.post('/selectServicio', async (req, res) => {
    try{
        const userRef = db.collection("servicio").doc(req.body.id);
        const response = await userRef.get();
        res.send(response.data());
    } catch(error) {
        res.send(error);
        console.log(error);
    }
})

app.post('/ActualizarServicio', async(req, res) =>{
    try{
        const userRef = await db.collection("servicio").doc(req.body.id)
        .update({
            nombre: req.body.nombre,
            imagen1: req.body.imagen1,
            imagen2: req.body.imagen2,
            imagen3: req.body.imagen3,
            estado: req.body.estado,
            descripcion: req.body.descripcion,
            beneficio: req.body.beneficio,
            caracteristicas: req.body.caracteristicas
        });

        res.send(userRef);
    }catch(error){
        console.log("Malo23"+error)
        res.send(error);
    }
})

app.post('/EliminarServicio', async(req, res) =>{
    try{
        const response = await db.collection("servicio").doc(req.body.nombre).delete();
        res.send(response)
    }catch(error){
        console.log("Malo:D"+error)
        res.send(error);
    }
})

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

app.post('/selectProducto', async (req, res) => {
    try{
        const userRef = db.collection("producto").doc(req.body.id);
        const response = await userRef.get();
        res.send(response.data());
    } catch(error) {
        res.send(error);
        console.log(error);
    }
})

app.post('/ActualizarProducto', async(req, res) =>{
    try{
        const userRef = await db.collection("producto").doc(req.body.id)
        .update({
            nombre: req.body.nombre,
            categoria: req.body.categoria,
            marca: req.body.marca,
            imagen1: req.body.imagen1,
            imagen2: req.body.imagen2,
            imagen3: req.body.imagen3,
            precio: req.body.precio,
            precioventa: req.body.precioventa,
            cantidad: req.body.cantidad,
            fecha: req.body.fecha,
            estado: req.body.estado,
            descripcion: req.body.descripcion,

        });

        res.send(userRef);
    }catch(error){
        console.log("Malo89"+error)
        res.send(error);
    }
})

app.post('/EliminarProducto', async(req, res) =>{
    try{
        const response = await db.collection("producto").doc(req.body.nombre).delete();
        res.send(response)
    }catch(error){
        console.log("Malo:D:D"+error)
        res.send(error);
    }
})

app.post('/ActualizarCarrito', async(req, res) => {
    try{
        const userRef = await db.collection("CarritoXUsuario").doc(req.body.nombre)
        .update({
            nombre: req.body.nombre,
            carrito: req.body.carrito,
        });
        res.send(userRef);
    }catch(error){
        res.send(error);
        console.log(error);
    }
});

app.post('/CargarCarrito', async(req, res) => {
    try{
        const userRef = db.collection("CarritoXUsuario").doc(req.body.correo);
        const response = await userRef.get();
        res.send(response.data());
    }catch(error){
        res.send(error);
        console.log(error);
    }
});

app.post('/ActualizarProducto2', async(req, res) =>{
    try{
        const userRef = await db.collection("producto").doc(req.body.id)
        .update({
            cantidad: req.body.cantidad,
        });
        res.send(userRef);
    }catch(error){
        console.log("Malooo"+error)
        res.send(error);
    }
})

app.post('/CrearFactura', (req, res) => {
    try{
        const RegistroData = req.body;
        const response = db.collection("Facturas").doc();
        const idfb = response.id;
        RegistroData.id = idfb;
        response.set(RegistroData);
        console.log(":D");
        res.send(response);
    }catch(error){
        res.send(error);
        console.log(error);
    }
});

app.post('/selectHistorial', async (req, res) => {
    try{
        const userRef = db.collection("Facturas").where("usuario", "==",req.body.correo);
        const response = await userRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.send(responseArr);
    } catch(error) {
        res.send(error);
        console.log(error);
    }
});

app.post('/submitDirecciones', async(req, res) =>{
    try{
        const correo=req.body.correo;
        const userRef = await db.collection("infousuario").doc(correo)
        .update({
            direcciones: req.body.direcciones
        });
        const response = await userRef.get();
        res.send(response.data());

    }catch(error){
        res.send(error);
    }
})

app.post('/submitTarjetas', async(req, res) =>{
    try{
        const correo=req.body.correo;
        const userRef = await db.collection("infousuario").doc(correo)
        .update({
            tarjetas: req.body.tarjetas
        });
        const response = await userRef.get();
        res.send(response.data());

    }catch(error){
        res.send(error);
    }
})

app.post('/CrearRepartidor', (req, res) => {
    try{
        const id = req.body.correo;
        const RegistroData = req.body;
        const response = db.collection("repartidor").doc(id).set(RegistroData);
        res.send(response);
    }catch(error){
        res.send(error);
        console.log(error);
    }
});

app.post('/create-checkout-session', async (req, res) => {
    const product = await stripe.products.create({
        name: 'Total',
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 2000,
        currency: 'usd',
      });
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      return_url: `${YOUR_DOMAIN}/index.html`,
    });
  
    res.send({clientSecret: session.client_secret});
  });
  
  app.get('/session-status', async (req, res) => {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  
    res.send({
      status: session.status,
      customer_email: session.customer_details.email
    });
  });

app.get('/selectRepartidores', async (req, res) => {
    try{
        const userRef = db.collection("repartidor");
        const response = await userRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.send(responseArr);
    } catch(error) {
        res.send(error);
    }
});

app.post('/selectRepartidor', async (req, res) => {
    try{
        const userRef = db.collection("repartidor").doc(req.body.id);
        const response = await userRef.get();
        res.send(response.data());
    } catch(error) {
        res.send(error);
        console.log(error);
    }
});

app.post('/ActualizarRepartidor', async(req, res) =>{
    try{
        const userRef = await db.collection("repartidor").doc(req.body.id)
        .update({
            nombre: req.body.nombre,
            fecha_nacimiento: req.body.fecha,
            telefono: req.body.telefono,
            vehiculo: req.body.vehiculo,
            placa: req.body.placa,
            contra: req.body.contra,
        });

        res.send(userRef);
    }catch(error){
        console.log("Malo34"+error)
        res.send(error);
    }
})

app.post('/EliminarRepartidor', async(req, res) =>{
    try{
        const response = await db.collection("repartidor").doc(req.body.nombre).delete();
        res.send(response)
    }catch(error){
        console.log("Malo:D2"+error)
        res.send(error);
    }
})

app.get('/selectFacturas', async (req, res) => {
    try{
        const userRef = db.collection("Facturas");
        const response = await userRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.send(responseArr);
    } catch(error) {
        res.send(error);
    }
});

app.post('/CrearPedido', (req, res) => {
    try{
        const RegistroData = req.body;
        const response = db.collection("pedido").doc();
        const idfb = response.id;
        RegistroData.id = idfb;
        response.set(RegistroData);
        res.send(response);
    }catch(error){
        res.send(error);
        console.log(error);
    }
});

app.post('/ActualizarFactura', async(req, res) =>{
    try{
        const userRef = await db.collection("Facturas").doc(req.body.id)
        .update({
            estado_entrega: req.body.texto,
        });
        const userRef2 = db.collection("Facturas").doc(req.body.id);
        const response = await userRef2.get();
        res.send(response.data());
    }catch(error){
        console.log("Malolololo"+error);
        res.send(error);
    }
})

app.post('/ActualizarFactura2', async(req, res) =>{
    try{
        const userRef = await db.collection("Facturas").doc(req.body.id)
        .update({
            repartidor: req.body.repartidor,
            estado_entrega: req.body.texto
        });
        res.send(userRef);
    }catch(error){
        console.log("Malolololo"+error);
        res.send(error);
    }
})

app.post('/selectPedidos', async (req, res) => {
    try{
        const userRef = db.collection("Facturas").where("repartidor", "==", req.body.id);
        const response = await userRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.send(responseArr);
    } catch(error) {
        res.send(error);
        console.log(error);
    }
});

app.post('/selectPedidos2', async (req, res) => {
    try{
        const userRef = db.collection("Facturas").where("id", "==",req.body.id);
        const response = await userRef.get();
        const responseData = [];
        response.forEach((doc) => {
            // Extract data from each document
            const data = doc.data();
            responseData.push(data);
        });
        res.send(responseData);
    } catch(error) {
        res.send(error);
        console.log(error);
    }
});

app.post("/updatePassword2", async(req,res)=>{

    const auth = getAuth();
    const user = auth.currentUser;
    updatePassword(user, req.body.password).then(() => {
        res.status(200).send({
            "msj":"contraseña actualizada",
        })
    }).catch((error) => {
        console.log(error);
        res.status(500).send({
            "msj":"error actualizando la contraseña"
        })
    });
})

app.post('/ActualizarRepartidor2', async(req, res) =>{
    try{
        const correo=req.body.correo;
        const userRef = await db.collection("repartidor").doc(correo)
        .update({
            nombre: req.body.nombre,
            vehiculo: req.body.vehiculo,
            placa: req.body.placa,
            telefono: req.body.telefono,
            contra: req.body.contra
        });
        
        res.send(userRef)
    }catch(error){
        res.send(error);
        console.log(error);
    }
})

app.post('/RepartidorXPedidos', async (req, res) => {
    try{
        const userRef = db.collection("pedido").where("orden", "==", req.body.id);
        const response = await userRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.send(responseArr);
    } catch(error) {
        res.send(error);
        console.log(error);
    }
});

app.post('/RepartidorXPedidos2', async (req, res) => {
    try{
        const userRef = db.collection("repartidor").where("correo", "==", req.body.id);
        const response = await userRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.send(responseArr);
    } catch(error) {
        res.send(error);
        console.log(error);
    }
});

app.post('/submitMarca', (req, res) => {
    try{
        const RegistroData = req.body;
        const response = db.collection("marca").doc();
        const idfb = response.id;
        RegistroData.id = idfb;
        response.set(RegistroData);
        res.send(RegistroData);
    }catch(error){
        res.send(error);
        console.log(error);
    }
});

app.get('/selectMarcas', async (req, res) => {
    try{
        const userRef = db.collection("marca");
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

app.post('/selectMarca', async (req, res) => {
    try{
        const userRef = db.collection("marca").doc(req.body.id);
        const response = await userRef.get();
        res.send(response.data());
    } catch(error) {
        res.send(error);
        console.log(error);
    }
})

app.post('/ActualizarMarca', async(req, res) =>{
    try{
        const userRef = await db.collection("marca").doc(req.body.id)
        .update({
            nombre: req.body.nombre,
            imagen1: req.body.imagen1,
            descripcion: req.body.descripcion,
        });

        res.send(userRef);
    }catch(error){
        console.log("Malo23"+error)
        res.send(error);
    }
})

app.post('/EliminarMarca', async(req, res) =>{
    try{
        const userRef = db.collection("marca").doc(req.body.nombre);
        const response2 = await userRef.get();
        const response = await db.collection("marca").doc(req.body.nombre).delete();
        res.send(response2.data());
    }catch(error){
        console.log("Malo:D"+error)
        res.send(error);
    }
})

app.post('/ActualizarProducto3', async(req, res) =>{
    try{
        const userRef = await db.collection("producto").doc(req.body.id)
        .update({
            carrusel: req.body.carrusel,
        });

        res.send(userRef);
    }catch(error){
        console.log("Malo89"+error)
        res.send(error);
    }
})

app.get('/SelectIDFactura', async (req, res) => {
    try{
        const userRef = db.collection("ids").doc("idfactura");
        const response = await userRef.get();
        res.send(response.data());
    } catch(error) {
        res.send(error);
        console.log(error);
    }
});

app.post('/ActualizarIDFactura', async(req, res) =>{
    try{
        const userRef = await db.collection("ids").doc("idfactura")
        .update({
            id: req.body.id,
        });
        res.send(userRef);
    }catch(error){
        console.log("Malo89"+error)
        res.send(error);
    }
})

app.get('/selectCarrusel', async (req, res) => {
    try{
        const userRef = db.collection("carrusel");
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

app.post('/submitCarrusel', (req, res) => {
    try{
        const RegistroData = req.body;
        const response = db.collection("carrusel").doc();
        const idfb = response.id;
        RegistroData.id = idfb;
        response.set(RegistroData);
        res.send(RegistroData);
    }catch(error){
        res.send(error);
        console.log(error);
    }
});


app.post('/selectCarrusel2', async (req, res) => {
    try{
        const userRef = db.collection("carrusel").doc(req.body.id);
        const response = await userRef.get();
        res.send(response.data());
    } catch(error) {
        res.send(error);
        console.log(error);
    }
})

app.post('/ActualizarCarrusel', async(req, res) =>{
    try{
        const userRef = await db.collection("carrusel").doc(req.body.id)
        .update({
            imagen: req.body.imagen,
        });

        res.send(userRef);
    }catch(error){
        console.log("Malo23"+error)
        res.send(error);
    }
})

app.post('/EliminarCarrusel', async(req, res) =>{
    try{
        const response = await db.collection("carrusel").doc(req.body.nombre).delete();
        res.send(response)
    }catch(error){
        console.log("Malo:D"+error)
        res.send(error);
    }
})


app.get('/selectCarrusel3', async (req, res) => {
    try{
        const userRef = db.collection("carrusel2");
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

app.post('/submitCarrusel2', (req, res) => {
    try{
        const RegistroData = req.body;
        const response = db.collection("carrusel2").doc();
        const idfb = response.id;
        RegistroData.id = idfb;
        response.set(RegistroData);
        res.send(RegistroData);
    }catch(error){
        res.send(error);
        console.log(error);
    }
});


app.post('/selectCarrusel4', async (req, res) => {
    try{
        const userRef = db.collection("carrusel2").doc(req.body.id);
        const response = await userRef.get();
        res.send(response.data());
    } catch(error) {
        res.send(error);
        console.log(error);
    }
})

app.post('/ActualizarCarrusel2', async(req, res) =>{
    try{
        const userRef = await db.collection("carrusel2").doc(req.body.id)
        .update({
            imagen: req.body.imagen,
        });

        res.send(userRef);
    }catch(error){
        console.log("Malo23"+error)
        res.send(error);
    }
})

app.post('/EliminarCarrusel2', async(req, res) =>{
    try{
        const response = await db.collection("carrusel2").doc(req.body.nombre).delete();
        res.send(response)
    }catch(error){
        console.log("Malo:D"+error)
        res.send(error);
    }
})

app.post('/ActualizarPagina1', async(req, res) =>{
    try{
        const userRef = await db.collection("pagina").doc("FotoTienda")
        .update({
            imagen: req.body.imagen,
        });

        res.send(userRef);
    }catch(error){
        console.log("Malo23"+error)
        res.send(error);
    }
})

app.post('/ActualizarPagina2', async(req, res) =>{
    try{
        const userRef = await db.collection("pagina").doc("FotoTitulo")
        .update({
            imagen: req.body.imagen,
        });

        res.send(userRef);
    }catch(error){
        console.log("Malo23"+error)
        res.send(error);
    }
})

app.get('/selectPagina', async (req, res) => {
    try{
        const userRef = db.collection("pagina");
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

app.post('/ActualizarMarca2', async(req, res) =>{
    try{
        const userRef = await db.collection("marca").doc(req.body.id)
        .update({
            carrusel: req.body.carrusel,
        });

        res.send(userRef);
    }catch(error){
        console.log("Malo89"+error)
        res.send(error);
    }
})

app.post('/ActualizarMarca3', async(req, res) =>{
    try{
        const userRef = await db.collection("marca").doc(req.body.id)
        .update({
            propia: req.body.propia,
        });

        res.send(userRef);
    }catch(error){
        console.log("Malo89"+error)
        res.send(error);
    }
})

app.post('/eliminarProductosXMarca', async (req, res) => {
    try{
        const response = db.collection("producto").where("marca", "==", req.body.marca).get()
        .then(querySnapshot => {
            querySnapshot.forEach(doc => {
                doc.ref.delete()
            });
        });
        console.log("Hecho")
        res.send(response);
    } catch(error) {
        res.send(error);
        console.log(error);
    }
});

app.post('/api/v2/transaction/hosted/sandbox', (req, res) => {
    // Aquí se obtienen los parámetros enviados en el cuerpo de la solicitud
    const { _key, _callback, _cancel, _complete, _order_id, _order_date, _order_content, _order_extras, _currency, _tax_amount, _shipping_amount, _amount, _first_name, _last_name, _email, _address, _address_alt, _zip, _city, _state, _country, expired_at } = req.body;

    // Aquí se realiza la validación de los campos según las especificaciones

    // Luego puedes procesar los datos como desees, por ejemplo, enviar una respuesta JSON
    res.json({ success: true, message: 'Datos recibidos correctamente' });
});


// Manejador para solicitudes GET (en caso de que sea necesario)
app.get('/api/v2/transaction/hosted/sandbox', (req, res) => {
    // Aquí se obtienen los parámetros enviados en la consulta de la URL
    const { _key, _callback, _cancel, _complete, _order_id, _order_date, _order_content, _order_extras, _currency, _tax_amount, _shipping_amount, _amount, _first_name, _last_name, _email, _address, _address_alt, _zip, _city, _state, _country, expired_at } = req.query;

    // Aquí se realiza la validación de los campos según las especificaciones

    // Luego puedes procesar los datos como desees, por ejemplo, enviar una respuesta JSON
    res.json({ success: true, message: 'Datos recibidos correctamente' });
});