const express = require('express')
const BannerController = require('../app/controllers/BannerController')

const router = express.Router()
const { requireSignin } = require('../middleware')

router.post('/createBanner', requireSignin, BannerController.createBanner)
router.post(`/searchBanners`, requireSignin, BannerController.searchBanners)
router.post(`/getDataFilterBanner`, requireSignin, BannerController.getDataFilterBanner)
router.post(`/getBanners`, requireSignin, BannerController.getBanners)
router.post(`/getAllBanners`, requireSignin, BannerController.getAllBanners)

module.exports = router
