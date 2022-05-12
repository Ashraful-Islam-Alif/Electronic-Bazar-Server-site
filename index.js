const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config()

//middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unautherized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })


}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qpebu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const inventoryCollection = client.db('laptopBazar').collection('products')
        const inventoryManageCollection = client.db('laptopBazar').collection('allProducts')
        const addedItemsCollection = client.db('laptopBazar').collection('ItemsAdded')

        //Auth(JWT)
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })

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

        //Reduce Quantity.
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
        //POST(addItems)
        app.post('/myItems', async (req, res) => {
            const newProduct = req.body;
            const result = await addedItemsCollection.insertOne(newProduct);
            res.send(result);
        })

        app.get('/myItems', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            console.log(decodedEmail);
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email };
                const cursor = addedItemsCollection.find(query);
                const products = await cursor.toArray();
                res.send(products)
            }
            else {
                res.status(403).send({ message: 'forbidden access' })
            }
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