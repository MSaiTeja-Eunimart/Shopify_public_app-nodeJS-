var express = require('express');
var router = express.Router();
let dotenv = require('dotenv').config();
let nonce = require('nonce')();
let querystring = require('querystring');
let crypto = require('crypto');
let request = require('request-promise');
let session = require('express-session');
let Shopify = require('shopify-api-node');
const mongoose = require('mongoose');
const url = 'mongodb://localhost/ProductDB';
const Product = require('../models/product');
const { title } = require('process');

mongoose.connect(url,{useNewUrlParser:true})
const con=mongoose.connection

con.on('open',()=>{
    console.log('connected to local database')
})

let access_token1 = ""

// Initial page 
router.get('/',(req,res)=>{
    res.send("Welcome to Shopify")
});

// Shops
router.get('/app',(req,res,next)=>{
    let shop=req.query.shop;
    res.render('app',{shop:shop});
});

//Installing  
router.get('/shopify',(req,res)=>{
    let shopName = req.query.shop;
    if(shopName){

        let  homeUrl = process.env.HOMEURL;
        let apiKey = process.env.SHOPIFY_API_KEY;
        let apiSecret = process.env.SHOPIFY_API_SECRET;
        let scope = "write_products";
        let state = nonce();
        let installUrl = 'https://' + shopName + '.myshopify.com/admin/oauth/authorize?client_id=' + apiKey + 
        '&scope=' + scope + '&redirect_uri=' + homeUrl + '/shopify/auth&state=' + state + '&grant_options[]=per-user';

        res.redirect(installUrl);
    }
    else{
        res.status(404).send('Specify the Shop Name');
    }
});

//Shopify auth
router.get('/shopify/auth', (req,res) =>{
    const {shop, hmac, code, state} = req.query;
    if(shop && hmac && code){
        console.log(" Parameters Recieved ");
        const map = Object.assign({},req.query);
        delete map['hmac'];
        const message = querystring.stringify(map);

        const acccessTokenRequesrUrl = 'https://' + shop + '/admin/oauth/access_token'
        const accessTokenPayLoad = {
            client_id : process.env.SHOPIFY_API_KEY,
            client_secret : process.env.SHOPIFY_API_SECRET, 
            code
        };
        request.post(acccessTokenRequesrUrl,{json : accessTokenPayLoad}).
            then((accessTokenResponse)=>{
            const access_token = accessTokenResponse.access_token;
            access_token1=access_token;
            console.log("Access Token " + access_token);
            //Geeting List of Products in the Store  using Api Call
            const apiRequestUrl = 'https://' + shop + '/admin/api/2021-07/products.json';
            const apiRequestHeader = {
                'X-Shopify-Access-Token' : access_token
            };
                request.get(apiRequestUrl,{ headers : apiRequestHeader })
                .then((apiResponse)=>{
                    console.log("Products Retrieved Successfully");
                    res.end(apiResponse);
                })
                .catch((err)=>{
                    console.log("Some Error Occured During Products Retrieval");
                    res.status(404).send("Something Went Wrong" + err);
                })
            });
    }
    else{
        res.status(404).send("Required Parameters Missing");
    } 
});


// Adding products into Shopify and local database
router.post("/addProduct", async(req,res)=>{
    console.log(access_token1);
    let new_product={
        product: {
            title:"aaaa",
            body_html:"Made by redmi",
            vendor:"REDMI",
            product_type:"Mobile",
            tags:"Mobile,phone"
        }
    };
    console.log(new_product);


    let url = 'https://' + req.query.shop + '/admin/products.json';
    let options = {
        method: 'POST',
        url: url,
        json: true,
        resolveWithFullResponse: true,
        headers: {
            'X-Shopify-Access-Token': access_token1,
            'content-type': 'application/json'
        },
        body: new_product
    };
    let pro1 = new Product(new_product.product);
    try
    {
        const product1 = await pro1.save();
        res.json(product1);
    }
    catch(err)
    {
        res.send(err);
    }

    request.post(options)
        .then((res)=>{
            console.log(res);
        })
        .catch((err)=>{
            console.log(err);
        });
});


// Deleting products from shopify and local database
router.post('/delete', async (req,res)=>{
    let url="https://" + req.query.shop + "/admin/products/" + req.query.id +'.json';

    let option = {
        method: 'DELETE',
        uri: url,
        resolveWithFullResponse: true,
        headers:{
            'X-Shopify-Access-Token': access_token1,
            'content-type':'application/json'
        }
    };
    request.delete(option)
    .then((response)=>{
        console.log(response.body);
    })
    .catch((err)=>{
        console.log(err);
    });

    try{
        const product = await Product.findById(req.query.id);
        const pro1=await product.remove();
        res.send(true)
    }
    catch(err){
        res.send(err);
    }
});


router.get('/allProducts',(req,res)=>{
    let url= "https://" + req.query.shop+ "/admin/products.json";

    let option ={
        method: 'GET',
        uri :url,
        json: true,
        headers :{
                'X-Shopify-Access-Token':access_token1,
                'content-type':'application/json'
        }
    };

    request(option)
    .then((body)=>{
        console.log(body);
        res.json(body);
    })
    .catch((err)=>{
        console.log(err);
        res.json(err);
    })
});


router.get('/database/allProducts',async(req,res)=>{
    try{
        const product = await Product.find();
        res.json(product);
    }
    catch(err)
    {
        res.send(err);
    }
});

module.exports = router;
