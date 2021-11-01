const express = require("express");
const mongoose = require("mongoose");
const jwt=require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const app = express();

const port = 3000;

mongoose.connect("mongodb://localhost:27017/authentication", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const User = require("./models/UserModel");
const auth = require("./middleware/auth");

var db = mongoose.connection;
db.on("error", console.error.bind(console, 'connection error'));
db.once("open", function () {
    console.log("Application is connected to the database");
})

app.get("/", (req, res) => {
    res.render("register.ejs");
})

app.get("/home", auth, async (req, res) => {
    console.log(req.user);
    res.render("home.ejs");
})

app.post("/register", async (req, res) => {
    try {
        const user = new User(req.body);
        const token = await user.generateToken();
        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 300000),
            httpOnly: true
        })
        const userCreated = await user.save();
        res.status(201).render("login.ejs");
    } catch (error) {
        res.status(400).send(error);
    }
})

app.get("/login", (req, res) => {
    res.render("login.ejs");
})

app.post("/login", async (req, res) => {
    try {
        const userEmail = req.body.email;
        const userPassword = req.body.password;
        const userFind = await User.findOne({ email: userEmail });
        const isMatch = await bcrypt.compare(userPassword, userFind.password);
        const token = await userFind.generateToken();
        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 5000000),
            httpOnly: true
        })
        if (isMatch) {
            res.status(200).redirect("/home");
        } else {
            res.send("Password not matching");
        }
    } catch (error) {
        res.status(400).render("login.ejs");
    }
})

app.get("/logout",auth,async(req,res)=>{
    try{
        req.user.tokens=req.user.tokens.filter((currentToken)=>{
            return currentToken!==req.token
        })
        res.clearCookie("jwt");
        await req.user.save();
        res.render("login.ejs");
    }catch(error){
        res.status(500).send(error);
    }
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
})
