const shortid = require('shortid')
const slugify = require('slugify')
const { json } = require('express')
const Action = require('../models/Action')
// eslint-disable-next-line import/order
const ObjectId = require('mongodb')
const NodeCache = require('node-cache')
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 })

// eslint-disable-next-line no-var
class ActionController {
    async createAction(req, res, next) {
        const action = new Action({
            actionName: req.body.actionName,
            actionSlug: `${slugify(req.body.actionName)}-${shortid.generate()}`,
            createdTime: Date.now(),
            updatedTime: Date.now(),
            createdBy: req.user.id,
        })
        console.log(action)
        // eslint-disable-next-line consistent-return
        action.save((error, result) => {
            if (error) return res.status(400).json({ error })
            if (result) {
                res.status(201).json({ result })
            }
        })
    }

    getActions = async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', '*')
        res.header('Access-Control-Allow-Credentials', true)

        try {
            const actions = await Action.find({})
                .populate(
                    { path: 'user', select: '_id firstname lastname' }
                )
                .exec()
            myCache.set('allActions', actions)
            res.status(200).json({ actions })
        } catch (error) {
            console.log(error)
        }
    }

    async getAllActions(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', '*')
        res.header('Access-Control-Allow-Credentials', true)
        if (myCache.has('allActions')) {
            res.status(200).json({ allActions: myCache.get('allActions') })
        } else {
            const allActions = await Action.find({}).populate(
                { path: 'user', select: '_id firstname lastname' }
            )
            if (allActions) {
                myCache.set('allActions', allActions)
                res.status(200).json({ allActions })
            }
        }
    }

    async updateAction(req, res, next) {
        Action.findOne({_id: req.body._id}, function(err, obj) {
            Action.updateOne(
                { 
                    _id: req.body._id, 
                },
                {
                    $set: {
                        actionName: req.body.actionName,
                        actionSlug: `${slugify(req.body.actionName)}-${shortid.generate()}`,
                        createdTime: obj.createdTime,
                        updatedTime: req.body.updatedTime,
                        createdBy: obj.createdBy
                    }
                }
            ).exec((error, action) => {
                if (error) return res.status(400).json({ error })
                if (action) {
                    res.status(201).json({ action })
                }
            })
        });
    }

    deleteActionById = (req, res) => {
        const { actionId } = req.body.payload
        if (actionId) {
            Action.deleteMany({ _id: actionId }).exec((error, result) => {
                if (error) return res.status(400).json({ error })
                if (result) {
                    res.status(202).json({ result })
                }
            })
        } else {
            res.status(400).json({ error: 'Params required' })
        }
    }

    getDataFilterAction = async (req, res, next) => {
        const options = {
            limit: 99,
            lean: true,
        }
        const searchModel = req.body
        const query = {}
        if (
            !!searchModel.ActionName &&
            Array.isArray(searchModel.ActionName) &&
            searchModel.ActionName.length > 0
        ) {
            query.actionName = { $in: searchModel.ActionName }
        }
        Action.paginate({ $and: [query] }, options).then(function (result) {
            return res.json({
                result,
            })
        })
    }

}
module.exports = new ActionController()
