const express = require('express')

const router = express.Router()
const ScreenHandlers = require('../app/controllers/ScreenController')
const { requireSignin } = require('../middleware')

router.post('/createScreen', requireSignin, ScreenHandlers.create)
router.post('/getScreens', requireSignin, ScreenHandlers.getScreens)
router.post('/getDataFilterScreen', requireSignin, ScreenHandlers.getDataFilterScreen)
router.post('/getAllScreens', requireSignin, ScreenHandlers.getAllScreens)
router.get('/screens', requireSignin, ScreenHandlers.getAllScreens)
module.exports = router
