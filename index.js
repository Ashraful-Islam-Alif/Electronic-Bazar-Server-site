const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config()

//middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qpebu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const inventoryCollection = client.db('laptopBazar').collection('products')
        const inventoryManageCollection = client.db('laptopBazar').collection('allProducts')

        //to find all 
        app.get('/inventory', async (req, res) => {
            const query = {};
            const cursor = inventoryCollection.find(query);
            const inventorys = await cursor.toArray();
            res.send(inventorys);
        })
        //to find all for manageInventory 
        app.get('/inventoryManage', async (req, res) => {
            const query = {};
            const cursor = inventoryManageCollection.find(query);
            const inventorys = await cursor.toArray();
            res.send(inventorys);
        })



        //to find single 
        app.get('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const inventory = await inventoryCollection.findOne(query);
            res.send(inventory);
        })

        //Reduce Quantity
        app.put('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const updatedUser = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    stock: updatedUser.newStock,
                }
            };
            const result = await inventoryCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        //Delete product
        app.delete('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await inventoryManageCollection.deleteOne(query);
            res.send(result);
        })
        //POST(add)
        app.post('/inventory', async (req, res) => {
            const newProduct = req.body;
            const result = await inventoryManageCollection.insertOne(newProduct);
            res.send(result);
        })

    }
    finally {

    }

}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Laptop Bazar')
})

app.listen(port, () => {
    console.log("Listening to port", port);
})