const shortid = require('shortid')
const slugify = require('slugify')
const { json } = require('express')
const Screen = require('../models/Screen')
// eslint-disable-next-line import/order
const ObjectId = require('mongodb').ObjectID
// eslint-disable-next-line no-var
var cloudinary = require('cloudinary').v2

cloudinary.config({
    // eslint-disable-next-line camelcase
    cloud_name: 'shoplaptop',
    // eslint-disable-next-line camelcase
    api_key: '672421112872878',
    // eslint-disable-next-line camelcase
    api_secret: 'zmqOX3J_4CliR5GifTptxoceHro',
    secure: true,
})
class ScreenController {
    async createScreen(req, res, next) {
        const { screenName, screenCode, screenDescription, status } = req.body
        const screen = new Screen({
            screenName,
            screenCode,
            screenDescription,
            status,
            createdBy: req.user.id,
        })
        // eslint-disable-next-line consistent-return
        screen.save((error, screen) => {
            if (error) return res.status(400).json({ error })
            if (screen) {
                res.status(201).json({ screen })
            }
        })
    }

    getScreens = async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', '*')
        res.header('Access-Control-Allow-Credentials', true)

        try {
            const screens = await Screen.find({})
                .select(
                    '_id screenName screenCode screenDescription status'
                )
                .populate(
                    { path: 'user', select: '_id firstname lastname' }
                )
                .exec()
            myCache.set('allScreens', screens)
            res.status(200).json({ screens })
        } catch (error) {
            console.log(error)
        }
    }

    async getAllScreens(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', '*')
        res.header('Access-Control-Allow-Credentials', true)
        if (myCache.has('allScreens')) {
            res.status(200).json({ allScreens: myCache.get('allScreens') })
        } else {
            const allScreens = await Screen.find({}).populate(
                { path: 'user', select: '_id firstname lastname' }
            )
            if (allScreens) {
                myCache.set('allScreens', allScreens)
                res.status(200).json({ allScreens })
            }
        }
    }

    getDataFilterScreen = async (req, res, next) => {
        const options = {
            limit: 99,
            lean: true,
        }
        console.log(req.body)
        const searchModel = req.body
        const query = {}
        if (
            !!searchModel.Screen_Name &&
            Array.isArray(searchModel.Screen_Name) &&
            searchModel.Screen_Name.length > 0
        ) {
            query.screenName = { $in: searchModel.Screen_Name }
        }
        if (
            !!searchModel.Description &&
            Array.isArray(searchModel.Description) &&
            searchModel.Description.length > 0
        ) {
            query.screenDescription = { $in: searchModel.Description }
        }
        Screen.paginate({ $and: [query] }, options).then(function (result) {
            return res.json({
                result,
            })
        })
    }
}
module.exports = new ScreenController()
