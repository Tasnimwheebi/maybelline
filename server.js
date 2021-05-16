'use strict';
require('dotenv').config();
const express = require('express');
const pg = require('pg');
const superagent = require('superagent');
const methodOverride = require('method-override');
const app = express();
const PORT = process.env.PORT || 3030;
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
const client = new pg.Client( { connectionString: process.env.DATABASE_URL, ssl: process.env.LOCALLY ? false : {rejectUnauthorized: false}} );

// http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline&price_greater_than=10&price_less_than=14
app.get('/',(req,res)=>{
    res.render('index');
});

app.post('/search',(req,res)=>{
    let priceGreater = req.body.price_greater_than;
    // console.log(req.body);
    let priceLess = req.body.price_lower_than;
    
    let url = `http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline&price_greater_than=${priceGreater}&price_less_than=${priceLess}`;
    superagent.get(url).then(data=>{
        let dataB = data.body;
        // console.log(dataB);
        res.render('getResult',{dataArr:dataB});
        });
       
    });



app.get('/allproducts',(req,res)=>{
    let url = `http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline`;
    superagent.get(url).then(data=>{
       let dataB = data.body;
    //    console.log('TASNEEM',dataB);
        res.render('allproducts',{dataArr:dataB});
    });
});

app.post('/addbrand',(req,res)=>{
    let {name,price,image_link,description} = req.body;
    let SQL = `INSERT INTO brand (name,price,image_link,description) VALUES($1,$2,$3,$4) RETURNING *;`;
    let safeValue= [name,price,image_link,description];
    client.query(SQL,safeValue).then(results=>{
        // console.log(results.rows);
        res.redirect('/myproducts');
    });
});

app.get('/myproducts',(req,res)=>{
    let SQL = `SELECT * FROM brand;`;
    client.query(SQL).then(results=>{

        res.render('myproduct',{dataArr:results.rows});
    });
});

app.get('/details/:id',(req,res)=>{
    let SQL = `SELECT * FROM brand WHERE id=$1;`;
    let safeValue =[req.params.id];
    client.query(SQL,safeValue).then(results=>{
        res.render('mycard',{dataArr:results.rows[0]});
    });
});

app.delete('/delete/:id',(req,res)=>{
    let SQL = `DELETE FROM brand WHERE id=$1;`;
    let safeValue = [req.params.id];
    client.query(SQL,safeValue).then(()=>{
        res.redirect('/myproducts');
    });
});

app.put('/update/:id',(req,res)=>{
    let{name,price,image_link,description}=req.body;
    let SQL = `UPDATE brand SET name=$1,price=$2,image_link=$3,description=$4 WHERE id=$5;`;
    let safeValue= [name,price,image_link,description,req.params.id];
    client.query(SQL,safeValue).then(()=>{
        res.redirect(`/details/${req.params.id}`);
    });
});
function Maybelline (data){
    this.name= data.name;
    this.price= data.price;
    this.image_link= data.image_link;
    this.description= data.description;

}
client.connect().then(()=>{
    app.listen(PORT,()=>{
        console.log(`listening on port ${PORT}`);
    })
})