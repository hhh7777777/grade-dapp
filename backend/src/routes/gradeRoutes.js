const express = require("express");
const controller = require("../controllers/gradeController");

const router = express.Router();

// API 路由集中管理，报告中的接口设计表可以直接对应这些路径。
router.get("/health", controller.health);
router.get("/admin", controller.admin);
router.get("/grade/:studentId", controller.getGrade);
router.post("/grade", controller.saveGrade);
router.get("/tx/:hash", controller.txStatus);

module.exports = router;
