require("dotenv").config();
const {
    AccountId,
    PrivateKey,
    Client,
    FileCreateTransaction,
    ContractCreateTransaction,
    ContractFunctionParameters,
    ContractCallQuery,
    Hbar,
} = require("@hashgraph/sdk");
const fs = require("fs");
const fastify = require('fastify')({ logger: true })
const PORT = 3000;
const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);
client.setDefaultMaxTransactionFee(new Hbar(1.0));
client.setMaxQueryPayment(new Hbar(0.05));

const contractBytecode = fs.readFileSync("LookupContract_sol_LookupContract.bin");

const fileCreateTx = new FileCreateTransaction()
    .setContents(contractBytecode)
    .setKeys([operatorKey])
    .freezeWith(client);
const fileCreateSign = await fileCreateTx.sign(operatorKey);
const fileCreateSubmit = await fileCreateSign.execute(client);
const fileCreateRx = await fileCreateSubmit.getReceipt(client);
const bytecodeFileId = fileCreateRx.fileId;

fastify.post('/:params', async function (req, rep) {
    let coords = req.query.coords
    let name = req.query.name

    const contractInstantiateTx = new ContractCreateTransaction()
        .setBytecodeFileId(bytecodeFileId)
        .setGas(100000)
        .setConstructorParameters(new ContractFunctionParameters().addString(name).addString(coords));
    const contractInstantiateSubmit = await contractInstantiateTx.execute(client);
    const contractInstantiateRx = await contractInstantiateSubmit.getReceipt(client);
    const contractId = contractInstantiateRx.contractId;
    const contractAddress = contractId.toSolidityAddress();
    return { address: contractAddress, status: "Coordinates successfully added!" }
})

fastify.get('/:params', async function (req, rep) {
    let user = req.query.name

    const contractQueryTx = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(100000)
        .setFunction("getCoordinates", new ContractFunctionParameters().addString(user))
        .setMaxQueryPayment(new Hbar(0.05));
    const contractQuerySubmit = await contractQueryTx.execute(client);
    const contractQueryResult = contractQuerySubmit.getString(0);

    return { coords: contractQueryResult }
})

fastify.listen(PORT, function (err, address) {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
})