const Page = require('../../models/Page')

class PageController {
    createPage(req, res, next) {
        const { banners, products } = req.files
        if (banners.length > 0) {
            req.body.banners = banners.map((banner, index) => ({
                img: `${process.env.API}/public/${banner.filename}`,
                navigateTo: `/bannerClicked?categoryId=${req.body.category}&type=${req.body.type}`,
            }))
        }
        if (products.length > 0) {
            req.body.products = products.map((product, index) => ({
                img: `${process.env.API}/public/${product.filename}`,
                navigateTo: `/productClicked?categoryId=${req.body.category}&type=${req.body.type}`,
            }))
        }
        // eslint-disable-next-line no-underscore-dangle
        req.body.createdBy = req.user._id
        // eslint-disable-next-line consistent-return
        Page.findOne({ category: req.body.category }).exec((error, page) => {
            if (error) return res.status(400).json({ error })
            if (page) {
                Page.findOneAndUpdate(
                    { category: req.body.category },
                    req.body
                    // eslint-disable-next-line consistent-return, no-shadow
                ).exec((error, updatedPage) => {
                    if (error) return res.status(400).json({ error })
                    if (updatedPage) {
                        return res.status(201).json({ page: updatedPage })
                    }
                })
            } else {
                // eslint-disable-next-line no-shadow
                const page = new Page(req.body)

                // eslint-disable-next-line consistent-return, no-shadow
                page.save((error, page) => {
                    if (error) return res.status(400).json({ error })
                    if (page) {
                        return res.status(201).json({ page })
                    }
                })
            }
        })
    }

    getPage(req, res) {
        const { category, type } = req.params
        if (type === 'page') {
            // eslint-disable-next-line consistent-return
            Page.findOne({ category }).exec((error, page) => {
                if (error) return res.status(400).json({ error })
                if (page) return res.status(200).json({ page })
            })
        }
    }
}

module.exports = new PageController()
