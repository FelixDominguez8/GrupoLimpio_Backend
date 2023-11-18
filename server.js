//RECORDA USAR UN .ENV AL FINAL!!!!

const express = require("express");

const puerto=3001;

const app = express();

const admin = require("firebase-admin");
const credentials = require("./key.json");

admin.initializeApp({
    credential: admin.credential.cert(credentials)
});

const db = admin.firestore();

app.use(express.json());

app.use(express.urlencoded({extended: true}));

app.listen(puerto,()=>{
    console.log("Servidor funcionando en el puerto",puerto);
});

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