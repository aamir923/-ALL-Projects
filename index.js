const express = require("express");
const path = require("path")
const cookieParser = require('cookie-parser');
const {connectToMongoDB} = require("./connection.js");
const {restrictTo,checkForAuthentication} = require('./middlewares/auth.js');

const URL = require('./models/url.js');
const app = express();
const PORT = 8001;

const urlRoute = require("./routes/url");
const staticRoute = require('./routes/staticRouter');
const userRoute = require('./routes/user');

connectToMongoDB('mongodb://localhost:27017/short-url')
.then(()=> console.log("MongoDB connected"));

app.set("view engine", "ejs");
app.set('views', path.resolve("./views"));

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(checkForAuthentication);

app.get("/test", async (req,res) => {
    const allUrls = await URL.find({})
    return res.render('home', {
        urls: allUrls,
    });
});

app.use('/url',restrictTo(["NORMAL"]),urlRoute);
app.use('/user',userRoute);
app.use('/',staticRoute);

app.get('/url/:shortId', async (req,res) => {
    const shortId = req.params.shortId;
    const entry = await URL.findOneAndUpdate({
        shortId
    },
    {
        $push: {
            visitHistory: {
                timestamp: Date.now(),
            },
        },
    });
    res.redirect(entry.redirectURL);
});

app.listen(PORT,()=> console.log(`Server Started at PORT: ${PORT}`));