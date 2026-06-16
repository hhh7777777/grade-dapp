// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GradeManager {
    // 合约部署者即系统唯一管理员，immutable 可减少读取成本并防止后续被修改。
    address public immutable admin;

    // 学生成绩的链上存储结构，exists 用于区分“成绩为 0”和“记录不存在”。
    struct GradeRecord {
        string studentId;
        string studentName;
        uint256 score;
        string remark;
        uint256 updatedAt;
        address updatedBy;
        bool exists;
    }

    mapping(bytes32 => GradeRecord) private grades;

    // 成绩新增或修改时触发事件，便于后端查询交易 Hash 与区块号。
    event GradeUpserted(
        string indexed studentId,
        string studentName,
        uint256 score,
        string remark,
        uint256 updatedAt,
        address indexed updatedBy
    );

    // 权限控制修饰器：只有管理员可以执行成绩写入操作。
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can modify grades");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function getAdmin() external view returns (address) {
        return admin;
    }

    function setGrade(
        string calldata studentId,
        string calldata studentName,
        uint256 score,
        string calldata remark
    ) external onlyAdmin {
        // 基础参数校验，避免无效数据写入链上造成永久污染。
        require(bytes(studentId).length > 0, "Student ID is required");
        require(bytes(studentName).length > 0, "Student name is required");
        require(score <= 100, "Score must be between 0 and 100");

        // 使用 keccak256 生成固定长度索引，适合在 mapping 中稳定定位学生记录。
        bytes32 gradeKey = _gradeKey(studentId);
        GradeRecord storage record = grades[gradeKey];

        record.studentId = studentId;
        record.studentName = studentName;
        record.score = score;
        record.remark = remark;
        record.updatedAt = block.timestamp;
        record.updatedBy = msg.sender;
        record.exists = true;

        emit GradeUpserted(studentId, studentName, score, remark, block.timestamp, msg.sender);
    }

    function getGrade(
        string calldata studentId
    )
        external
        view
        returns (
            bool exists,
            string memory studentIdValue,
            string memory studentName,
            uint256 score,
            string memory remark,
            uint256 updatedAt,
            address updatedBy
        )
    {
        bytes32 gradeKey = _gradeKey(studentId);
        GradeRecord storage record = grades[gradeKey];

        // 不存在时返回合法空结果，方便前端展示“暂无记录”而不是交易回滚。
        if (!record.exists) {
            return (false, "", "", 0, "", 0, address(0));
        }

        return (
            true,
            record.studentId,
            record.studentName,
            record.score,
            record.remark,
            record.updatedAt,
            record.updatedBy
        );
    }

    function hasGrade(string calldata studentId) external view returns (bool) {
        return grades[_gradeKey(studentId)].exists;
    }

    // 内部工具函数：将字符串学号转换为链上存储使用的 bytes32 键。
    function _gradeKey(string memory studentId) internal pure returns (bytes32) {
        return keccak256(bytes(studentId));
    }
}
