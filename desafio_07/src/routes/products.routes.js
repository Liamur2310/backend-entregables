import express from 'express';
import ProductsManager from '../managers/product_manager.js';

const router = express.Router();
const manager = new ProductsManager("../src/managers/productos.json");

router.use((req, res, next) => {
    console.log("Request:", req);
    next();
});

router.get("/", (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const sort = req.query.sort;
        const query = req.query.query;

        let products = manager.getProducts();

        const queryLower = query ? query.toLowerCase() : '';

        switch (queryLower) {
            case 'category':
                const category = req.query.category;
                if (category) {
                    products = products.filter(product => product.category.toLowerCase() === category.toLowerCase());
                }
                break;

            case 'availability':
                const availability = req.query.availability;
                if (availability) {
                    products = products.filter(product => product.availability.toLowerCase() === availability.toLowerCase());
                }
                break;
        }

        if (sort) {
            if (sort === 'asc') {
                products.sort((a, b) => a.price - b.price);
            } else if (sort === 'desc') {
                products.sort((a, b) => b.price - a.price);
            }
        }

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = products.slice(startIndex, endIndex);

        const username = req.session.user ? req.session.user.name : null;
        const role = req.session.user ? req.session.user.role : null;

        const totalPages = Math.ceil(products.length / limit);
        const hasPrevPage = page > 1;
        const hasNextPage = endIndex < products.length;
        const prevLink = hasPrevPage ? `/api/products?limit=${limit}&page=${page - 1}&sort=${sort}&query=${query}` : null;
        const nextLink = hasNextPage ? `/api/products?limit=${limit}&page=${page + 1}&sort=${sort}&query=${query}` : null;

        const responseObj = {
            status: 'success',
            payload: paginatedProducts,
            totalPages,
            prevPage: page - 1,
            nextPage: page + 1,
            page,
            hasPrevPage,
            hasNextPage,
            prevLink,
            nextLink
        };

        // Renderiza la vista realTimeProducts y pasa los datos del usuario y productos paginados
        res.render('realTimeProducts', { username, products: responseObj });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: 'error', error: 'Error interno del servidor ' });
    }
});

router.post('/', async (req, res) => {
    const { title, description, code, price, status, stock, category, thumbnails } = req.body;

    let result = await manager.addProduct(title, description, code, price, status, stock, category, thumbnails);
    res.status(result.status).json(result.responseBody);
});

router.delete('/:pid', async (req, res) => {
    const productId = parseInt(req.params.pid);

    let result = await manager.deleteProduct(productId);
    res.status(result.status).json(result.responseBody);
});

router.put('/:pid', async (req, res) => {
    let productID = parseInt(req.params.pid);
    let productFields = req.body;
    let result = await manager.updateProduct(productID, productFields);
    res.status(result.status).json(result.responseBody);
});

function autenticarUsuario(username, password, email){
    return (email ==='adminCoder@coder.com', password === 'adminCod3r123', username === 'coder')
}

export default router;
