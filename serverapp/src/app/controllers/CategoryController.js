const slugify = require('slugify')
const env = require('dotenv')
const shortid = require('shortid')
const Category = require('../models/Category')

function createCategories(categories, parentId = null) {
    const categoryList = []
    let category
    if (parentId == null) {
        category = categories.filter((cat) => cat.parentId === undefined)
    } else {
        category = categories.filter((cat) => cat.parentId === parentId)
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const cate of category) {
        categoryList.push({
            // eslint-disable-next-line no-underscore-dangle
            _id: cate._id,
            name: cate.name,
            slug: cate.slug,
            parentId: cate.parentId,
            image: cate.categoryImage,
            type: cate.type,
            // eslint-disable-next-line no-underscore-dangle
            children: createCategories(categories, cate._id),
        })
    }
    return categoryList
}

class CategoryController {
    create(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', '*')
        res.header('Access-Control-Allow-Credentials', true)
        const categoryObject = {
            name: req.body.name,
            slug: `${slugify(req.body.name)}-${shortid.generate()}` ,
            categoryImage: req.body.categoryImage
        }
        if (req.file) {
            categoryObject.categoryImage = `/uploads/${req.file.filename}`
        }
        if (req.body.parentId) {
            categoryObject.parentId = req.body.parentId
        }
        const cat = new Category(categoryObject)
        // eslint-disable-next-line consistent-return
        cat.save((error, category) => {
            if (error) return res.status(400).json({ error })
            if (category) {
                return res.status(201).json({ category })
            }
        })
    }

    getCategories(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', '*')
        res.header('Access-Control-Allow-Credentials', true)
        // eslint-disable-next-line consistent-return
        Category.find({}).exec((error, categories) => {
            if (error) return res.status(400).json({ error })

            if (categories) {
                const categoryList = createCategories(categories)
                res.status(200).json({ categoryList })
            }
        })
    }

    async updateCategories(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', '*')
        res.header('Access-Control-Allow-Credentials', true)
        const { _id, name, parentId, type } = req.body
        const updatedCategories = []
        if (name instanceof Array) {
            for (let i = 0; i < name.length; i++) {
                const category = {
                    name: name[i],
                    type: type[i],
                }
                if (parentId[i] !== '') {
                    category.parentId = parentId[i]
                }
                // eslint-disable-next-line no-await-in-loop
                const updatedCategory = await Category.findOneAndUpdate(
                    { _id: _id[i] },
                    category,
                    { new: true }
                )
                updatedCategories.push(updatedCategory)
            }
            return res.status(201).json({ updatedCategories })
        }
        const category = {
            name,
            type,
        }
        if (parentId !== '') {
            category.parentId = parentId
        }
        const updatedCategory = await Category.findOneAndUpdate(
            { _id },
            category,
            {
                new: true,
            }
        )
        return res.status(201).json({ updatedCategory })
    }

    async deleteCategories(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', '*')
        res.header('Access-Control-Allow-Credentials', true)
        const { ids } = req.body.payload
        const deleteCategories = []
        for (let i = 0; i < ids.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            const deleteCategory = await Category.findOneAndDelete({
                // eslint-disable-next-line no-underscore-dangle
                _id: ids[i]._id,
            })
            deleteCategories.push(deleteCategory)
        }
        if (deleteCategories.length === ids.length) {
            res.status(200).json({ message: 'Categories removed' })
        } else {
            res.status(400).json({ message: 'Something went wrong' })
        }
    }
    getDataFilter = async (req, res, next) => {
        const options = {
            limit: 99,
            lean: true,
        }
        console.log(req.body)
        const searchModel = req.body
        const query = {}
        if (
            !!searchModel.CategoryName &&
            Array.isArray(searchModel.CategoryName) &&
            searchModel.CategoryName.length > 0
        ) {
            query._id = { $in: searchModel.CategoryName }
        }

        if (!!searchModel.Product_Sellprice) {
            query.Product_Sellprice = { $in: searchModel.Product_Sellprice }
        }

        if (!!searchModel.CategoryId && searchModel.CategoryId.length > 0) {
            query.category = { $in: searchModel.CategoryId }
        }

        if (!!searchModel.Status && searchModel.Status.length > 0) {
            query.Status = { $in: searchModel.Status }
        }
        Category.paginate({ $and: [query] }, options).then(function (result) {
            return res.json({
                result: createCategories(result.docs),
            })
        })
    }
}

module.exports = new CategoryController()
