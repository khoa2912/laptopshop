const shortid = require('shortid')
const slugify = require('slugify')
const { json } = require('express')
const RoleAction = require('../models/RoleAction')
const Action = require('../models/Action')
const Role = require('../models/Role')
// eslint-disable-next-line import/order
const ObjectId = require('mongodb')
const NodeCache = require('node-cache')

const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 })

// eslint-disable-next-line no-var
class RoleActionController {
    async createRoleAction(req, res, next) {
        console.log(req.body)

        const roleaction = new RoleAction({
            roleId: req.body.roleId,
            listAction: req.body.listAction,
            createdTime: Date.now(),
            updatedTime: Date.now(),
            createdBy: req.user.id,
        })
        // eslint-disable-next-line consistent-return
        roleaction.save((error, roleaction) => {
            if (error) return res.status(400).json({ error })
            if (roleaction) {
                res.status(201).json({ roleaction })
            }
        })
    }

    getRoleActions = async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', '*')
        res.header('Access-Control-Allow-Credentials', true)

        try {
            const roleactions = await RoleAction.find({})
                .populate({ path: 'role', select: '_id nameRole' })
                .populate({ path: 'action', select: '_id nameAction' })
                .populate({ path: 'user', select: '_id firstname lastname' })
                .exec()
            myCache.set('allRoleActions', roleactions)
            res.status(200).json({ roleactions })
        } catch (error) {
            console.log(error)
        }
    }

    async getAllRoleActions(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', '*')
        res.header('Access-Control-Allow-Credentials', true)
        if (myCache.has('allRoleActions')) {
            res.status(200).json({ allRoleActions: myCache.get('allRoleActions') })
        } else {
            const allRoleActions = await RoleAction.find({})
            .populate({ path: 'role', select: '_id nameRole' })
            .populate({ path: 'action', select: '_id nameAction' })
            .populate({ path: 'user', select: '_id firstname lastname' })
            if (allRoleActions) {
                myCache.set('allRoleActions', allRoleActions)
                res.status(200).json({ allRoleActions })
            }
        }
    }

    async updateRoleAction(req, res, next) {
        RoleAction.findOne({_id: req.body._id}, function(err, obj) {
            RoleAction.updateOne(
                { 
                    _id: req.body._id, 
                },
                {
                    $set: {
                        roleId: req.body.roleId,
                        listAction: req.body.listAction,
                        createdTime: obj.createdTime,
                        updatedTime: req.body.updatedTime,
                        createdBy: obj.createdBy,
                    }
                }
            ).exec((error, roleaction) => {
                if (error) return res.status(400).json({ error })
                if (roleaction) {
                    res.status(201).json({ roleaction })
                }
            })
        });
    }

    deleteRoleActionById = (req, res) => {
        const { roleactionId } = req.body.payload
        if (roleactionId) {
            RoleAction.deleteMany({ _id: roleactionId }).exec((error, result) => {
                if (error) return res.status(400).json({ error })
                if (result) {
                    res.status(202).json({ result })
                }
            })
        } else {
            res.status(400).json({ error: 'Params required' })
        }
    }

    getDataFilterRoleAction = async (req, res, next) => {
        const options = {
            limit: 99,
            lean: true,
            populate: [
                { path: 'role', select: '_id nameRole' },
                { path: 'action', select: '_id nameAction' },
                { path: 'user', select: '_id firstname lastname' }
            ],
        }
        console.log(req.body)
        const searchModel = req.body
        const query = {}
        if (
            !!searchModel.RoleID &&
            Array.isArray(searchModel.RoleID) &&
            searchModel.RoleID.length > 0
        ) {
            query.roleId = { $in: searchModel.RoleID }
        }
        // if (
        //     !!searchModel.Description &&
        //     Array.isArray(searchModel.Description) &&
        //     searchModel.Description.length > 0
        // ) {
        //     query.description = { $in: searchModel.Description }
        // }
        RoleAction.paginate({ $and: [query] }, options).then(function (result) {
            return res.json({
                result,
            })
        })
    }

}
module.exports = new RoleActionController()
