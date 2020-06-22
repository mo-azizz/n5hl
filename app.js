require ('dotenv').config();
const randomString = require('randomstring');
const express = require('express');
const app = express();
const monk = require('monk');
const db = monk(process.env.MONGO_URI)
const bodyParser = require('body-parser');
const yup = require('yup');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
let shortcuts= db.get('shortcuts');
shortcuts.createIndex({extension:1},{unique: true});
let schema = yup.object().shape({
    url: yup.string().trim().url().required(),
    extension: yup.string().trim().matches(/[\w]/),
})
app.get('/', (req,res) => {

    res.render('index');
    
});
app.post('/addNewUrl', async(req,res) =>{
    //TODO PROCESS POST REQUEST TO ADD NEW URL.
    let { url, extension } = req.body;
    if (!extension){extension = randomString.generate(5)}else{
        let existing = await shortcuts.findOne({extension});
        if (existing){
            res.send("ALREADY EXIST!!");
        }
    }
    await schema.validate({
        url,
        extension,
    });
    extension = extension.toLowerCase();
    const newShortCut = {
        url,
        extension
    };
    let complete = await shortcuts.insert(newShortCut);
    console.log(complete);
    res.send(complete)
});
app.get('/all', async (req,res) => {
    let result = await shortcuts.find({});
    res.send(result);
});
app.get('/:extension', async (req,res) => {
    //TODO CHECK IF EXTENSION EXIST AND REDIRECT TO IT.
    let extension = req.params.extension;
    let existing = await shortcuts.findOne({extension});
    if (existing){res.redirect(existing.url)}else{
        res.send('NOT FOUND !!');
    }
});

app.listen(process.env.PORT, () => console.log('app listinig on 127.0.0.1'));