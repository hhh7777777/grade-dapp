// 前端使用这份 ABI 与已部署的 GradeManager 合约交互。
// 这里只保留当前页面真实会调用到的方法和事件，便于课程设计展示时理解。
export const GRADE_MANAGER_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "string",
        name: "studentId",
        type: "string"
      },
      {
        indexed: false,
        internalType: "string",
        name: "studentName",
        type: "string"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "score",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "string",
        name: "remark",
        type: "string"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "updatedAt",
        type: "uint256"
      },
      {
        indexed: true,
        internalType: "address",
        name: "updatedBy",
        type: "address"
      }
    ],
    name: "GradeUpserted",
    type: "event"
  },
  {
    inputs: [],
    name: "getAdmin",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "studentId",
        type: "string"
      }
    ],
    name: "getGrade",
    outputs: [
      {
        internalType: "bool",
        name: "exists",
        type: "bool"
      },
      {
        internalType: "string",
        name: "studentIdValue",
        type: "string"
      },
      {
        internalType: "string",
        name: "studentName",
        type: "string"
      },
      {
        internalType: "uint256",
        name: "score",
        type: "uint256"
      },
      {
        internalType: "string",
        name: "remark",
        type: "string"
      },
      {
        internalType: "uint256",
        name: "updatedAt",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "updatedBy",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "studentId",
        type: "string"
      },
      {
        internalType: "string",
        name: "studentName",
        type: "string"
      },
      {
        internalType: "uint256",
        name: "score",
        type: "uint256"
      },
      {
        internalType: "string",
        name: "remark",
        type: "string"
      }
    ],
    name: "setGrade",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];
