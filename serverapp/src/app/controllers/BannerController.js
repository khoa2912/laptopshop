const shortid = require('shortid')
const slugify = require('slugify')
const { json } = require('express')
const Banner = require('../models/Banner')
// eslint-disable-next-line import/order
const ObjectId = require('mongodb')
const NodeCache = require('node-cache')

const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 })

function generateSortOptions(sortFields, sortAscending = true) {
    const sort = {}
    const sortType = sortAscending ? 1 : -1
    return new Promise((resolve) => {
        if (!!sortFields && sortFields.length > 0) {
            sortFields.forEach((field) => {
                switch (field) {
                    case 'Banner_Code': {
                        sort.Banner_Code = sortType
                        break
                    }
                    case 'BannerName': {
                        sort.BannerName = sortType
                        break
                    }
                    default:
                        break
                }
            })
            resolve(sort)
        } else {
            resolve({})
        }
    })
}

// eslint-disable-next-line no-var
class BannerController {
    async createBanner(req, res, next) {
        const { nameBanner, codeBanner, image, slug } = req.body
        console.log(req.body)

        const banner = new Banner({
            nameBanner,
            codeBanner,
            image,
            slug,
            createdBy: req.user.id,
        })
        // eslint-disable-next-line consistent-return
        banner.save((error, display) => {
            if (error) return res.status(400).json({ error })
            if (display) {
                res.status(201).json({ display })
            }
        })
    }

    getBanners = async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', '*')
        res.header('Access-Control-Allow-Credentials', true)

        try {
            const banners = await Banner.find({})
                .select(
                    '_id nameBanner codeBanner image slug createdBy'
                )
                .populate(
                    { path: 'user', select: '_id firstname lastname' }
                )
                .exec()
            myCache.set('allBanners', banners)
            res.status(200).json({ banners })
        } catch (error) {
            console.log(error)
        }
    }

    async getAllBanners(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', '*')
        res.header('Access-Control-Allow-Credentials', true)
        if (myCache.has('allBanners')) {
            res.status(200).json({ allBanners: myCache.get('allBanners') })
        } else {
            const allBanners = await Banner.find({}).populate(
                { path: 'user', select: '_id firstname lastname' }
            )
            if (allBanners) {
                myCache.set('allBanners', allBanners)
                res.status(200).json({ allBanners })
            }
        }
    }

    getDataFilterBanner = async (req, res, next) => {
        const options = {
            limit: 99,
            lean: true,
        }
        console.log(req.body)
        const searchModel = req.body
        const query = {}
        if (
            !!searchModel.BannerName &&
            Array.isArray(searchModel.BannerName) &&
            searchModel.BannerName.length > 0
        ) {
            query.nameBanner = { $in: searchModel.BannerName }
        }

        if (
            !!searchModel.Banner_Code &&
            Array.isArray(searchModel.Banner_Code) &&
            searchModel.Banner_Code.length > 0
        ) {
            query.codeBanner = { $in: searchModel.Banner_Code }
        }

        Banner.paginate({ $and: [query] }, options).then(function (result) {
            return res.json({
                result,
            })
        })
    }

    search = async function (req, res) {
        const query = {}
        const { page } = req.body.searchOptions
        const limit = parseInt(req.body.searchOptions.limit, 99)
        const sortFields = req.body.searchOptions.sort
        const sortAscending = req.body.searchOptions.sortAscending
        //Tạo điều kiện sắp xếp
        const sort = await generateSortOptions(sortFields, sortAscending)
        const options = {
            //select:   'Status',
            sort,
            page,
            limit,
            lean: true,
        }

        const searchModel = req.body.searchModel

        if (
            typeof searchModel.Banner_Code === 'string' &&
            !!searchModel.Banner_Code
        ) {
            query.Banner_Code = {
                $regex: new RegExp(searchModel.Banner_Code, 'i'),
            }
        } else if (
            typeof searchModel.Banner_Code === 'object' &&
            !!searchModel.Banner_Code &&
            searchModel.Banner_Code.length > 0
        ) {
            query.Banner_Code = { $in: searchModel.Banner_Code }
        } else if (
            !!searchModel.Banner_Code &&
            Array.isArray(searchModel.Banner_Code) &&
            searchModel.Banner_Code.length > 0
        ) {
            query.Banner_Code = { $in: searchModel.Banner_Code }
        }

        if (
            !!searchModel.BannerName &&
            searchModel.BannerName.length > 0
        ) {
            query.BannerName = { $in: searchModel.BannerName }
        }

        Banner.paginate({ $and: [query] }, options).then(function (result) {
            return res.json({
                returnCode: 1,
                result,
            })
        })
    }

    searchBanners = async (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', '*')
        res.header('Access-Control-Allow-Credentials', true)
        const { q, sortBanner, sortBy, userId } = req.body.data.payload
        const listQuery = []
        if (q !== '') {
            const searchName = q
            const rgx = (pattern) => new RegExp(`.*${pattern}.*`)
            const searchNameRgx = rgx(searchName)

            if (userId) {
                const searchQuery = {
                    $match: {
                        name: { $regex: searchNameRgx, $options: 'i' },
                        user: ObjectId(userId),
                    },
                }
                listQuery.push(searchQuery)
            } else {
                const searchQuery = {
                    $match: { name: { $regex: searchNameRgx, $options: 'i' } },
                }
                listQuery.push(searchQuery)
            }
        }
        if (sortBy) {
            const banner = bannerSearch === 'asc' ? 1 : -1
            listQuery.push({ $sort: { [sortBy]: banner } })
        }
        try {
            const bannersFilter = await Banner.aggregate(listQuery).exec()
            if (bannersFilter) {
                res.status(200).json({ bannerSearch: bannersFilter })
            }
        } catch (error) {
            console.log(error)
        }
    }
}
module.exports = new BannerController()
