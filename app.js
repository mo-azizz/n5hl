
const randomString = require('randomstring');
const express = require('express');
const helmet = require('helmet');
const app = express();
app.use(helmet());
app.use(express.static('public'));
const fs = require('fs');
const monk = require('monk');
const db = monk(process.env.MONGODB_URI);
const bodyParser = require('body-parser');
const yup = require('yup');
const morgan = require('morgan');
const path = require('path');
let accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
app.use(morgan('combined', { stream: accessLogStream }))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
let shortcuts= db.get('shortcuts');
shortcuts.createIndex({extension:1},{unique: true});
let schema = yup.object().shape({
    url: yup.string().trim().url().required(),
    extension: yup.string().trim().matches( /^[a-zA-Z0-9]$/),
});
let error;
let complete;
app.get('/', (req,res) => {
    
    res.render('index', {complete,error});
    
});
app.post('/addNewUrl', async(req,res) =>{
    //TODO PROCESS POST REQUEST TO ADD NEW URL.
    try{
    let { url, extension } = req.body;
    if (!extension){extension = randomString.generate(5)}else{
        let existing = await shortcuts.findOne({extension});
        if (existing){
            
            throw new Error(`the extension "${extension}"  ALREADY EXISTS!!`);

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
    res.render('index', {complete : complete.extension,error});
}catch (error){
    console.log(error)
    if (error.toString().includes('match')) error = 'ValidationError: extension must only contain alphabetical characters a-z A-Z or numbers 0-9';
 res.render('index', {complete,error})
}
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
        error = 'ALREADY EXISTING'
    }
});
app.use((error, req, res, next) => {
    if (error.status) {
      res.status(error.status);
    } else {
      res.status(500);
    }
    res.render('index',{complete,error});
  });
app.listen(process.env.PORT, () => console.log('app listinig on 127.0.0.1'));