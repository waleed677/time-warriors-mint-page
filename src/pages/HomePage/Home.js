import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectWallet } from "../../redux/blockchain/blockchainActions";
import { fetchData } from "./../../redux/data/dataActions";
import * as s from "./../../styles/globalStyles";
import Navbar from "../../components/Navbar/Navbar";
import Social from "../../components/SocialMedia/Social";
import Loader from "../../components/Loader/loader";
import whitelistAddresses from "./whiteListAddresses";
import airDropAddresses from "./airDropAddresses";

const { createAlchemyWeb3, ethers } = require("@alch/alchemy-web3");
var Web3 = require('web3');
var Contract = require('web3-eth-contract');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

// Whitelist MerkleTree
const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
const rootHash = merkleTree.getRoot();
console.log('Whitelist Merkle Tree\n', merkleTree.toString());

// AirDrop MerkleTree
const leafNodesAir = airDropAddresses.map(addr => keccak256(addr));
const merkleTreeAir = new MerkleTree(leafNodesAir, keccak256, { sortPairs: true });
const rootHashAir = merkleTreeAir.getRoot();
console.log('AirDrop Merkle Tree\n', merkleTreeAir.toString());

function Home() {
  let cost = 0.00;
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [claimingNft, setClaimingNft] = useState(false);
  const [mintDone, setMintDone] = useState(false);
  const [supply, setTotalSupply] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [mintAmount, setMintAmount] = useState(1);
  const [displayCost, setDisplayCost] = useState(cost);
  const [state, setState] = useState(-1);
  const [canMintWL, setCanMintWL] = useState(false);
  const [disable, setDisable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nftCost, setNftCost] = useState(-1);
  const [statusAlert, setStatusAlert] = useState("");
  const [max, setMax] = useState(0);
  const [proof, setProof] = useState([]);
  const [canMintFree, setCanMintFree] = useState(false);

  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: {
      NAME: "",
      SYMBOL: "",
      ID: 0,
    },
    NFT_NAME: "",
    SYMBOL: "",
    MAX_SUPPLY: 1,
    WEI_COST: 0,
    DISPLAY_COST: 0,
    GAS_LIMIT: 0,
    MARKETPLACE: "",
    MARKETPLACE_LINK: "",
    SHOW_BACKGROUND: false,
  });

  const claimNFTs = () => {
    canMintFree ? cost = 0 : cost = nftCost;
    cost = Web3.utils.toWei(String(cost), "ether");
    let gasLimit = CONFIG.GAS_LIMIT;
    let totalCostWei = String(cost * mintAmount);
    let totalGasLimit = String(gasLimit * mintAmount);
    setFeedback(`Minting your ${CONFIG.NFT_NAME}`);
    setClaimingNft(true);
    setDisable(true);
    setLoading(true);

    if (canMintFree) {  
      blockchain.smartContract.methods
        .mintAirdrop(proof)
        .send({
          gasLimit: String(totalGasLimit),
          to: CONFIG.CONTRACT_ADDRESS,
          from: blockchain.account,
          value: totalCostWei,
        })
        .once("error", (err) => {
          console.log(err);
          setFeedback("Sorry, something went wrong please try again later.");
          setClaimingNft(false);
          setLoading(false);
        })
        .then(() => {
          setLoading(false);
          setMintDone(true);
          setFeedback(`Congratulation, your Free mint is successful.`);
          setClaimingNft(false);
          blockchain.smartContract.methods
            .totalSupply()
            .call()
            .then((res) => {
              setTotalSupply(res);
            });

          dispatch(fetchData(blockchain.account));
        });
    } else {
      blockchain.smartContract.methods
        .mint(mintAmount, proof)
        .send({
          gasLimit: String(totalGasLimit),
          to: CONFIG.CONTRACT_ADDRESS,
          from: blockchain.account,
          value: totalCostWei,
        })
        .once("error", (err) => {
          console.log(err);
          setFeedback("Sorry, something went wrong please try again later.");
          setClaimingNft(false);
          setLoading(false);
        })
        .then(() => {
          setLoading(false);
          setMintDone(true);
          setFeedback(`Congratulation, your mint is successful.`);
          setClaimingNft(false);
          blockchain.smartContract.methods
            .totalSupply()
            .call()
            .then((res) => {
              setTotalSupply(res);
            });

          dispatch(fetchData(blockchain.account));
        });
    }

  };


  const decrementMintAmount = () => {
    let newMintAmount = mintAmount - 1;
    if (newMintAmount < 1) {
      newMintAmount = 1;
    }
    setMintAmount(newMintAmount);
    setDisplayCost(
      parseFloat(nftCost * newMintAmount).toFixed(2)
    );
  };

  const incrementMintAmount = () => {
    let newMintAmount = mintAmount + 1;
    newMintAmount > max
      ? (newMintAmount = max)
      : newMintAmount;
    setDisplayCost(
      parseFloat(nftCost * newMintAmount).toFixed(2)
    );
    setMintAmount(newMintAmount);
  };

  const maxNfts = () => {
    setMintAmount(max);
    setDisplayCost(
      parseFloat(nftCost * max).toFixed(2)
    );

  };

  const getData = async () => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
      dispatch(fetchData(blockchain.account));

      const claimingAddressAirDrop = keccak256(blockchain.account);
      const hexProofAirDrop = merkleTreeAir.getHexProof(claimingAddressAirDrop);
      let canMintFree = merkleTree.verify(hexProofAirDrop, claimingAddressAirDrop, rootHashAir);
      let airDropAllowed = await blockchain.smartContract.methods
        .airdropAllowed(blockchain.account, hexProofAirDrop)
        .call();
    

        console.log({airDropAllowed});
        console.log({canMintFree});
      if (canMintFree && airDropAllowed) {
        setProof(hexProofAirDrop);
        setCanMintFree(airDropAllowed);
        setFeedback(`You've been airdroped and can mint free NFTs.`);
        setDisable(false);
      }else{
        setCanMintFree(airDropAllowed);
      }

      if (state == 1 && !airDropAllowed) {
        const claimingAddress = keccak256(blockchain.account);
        const hexProof = merkleTree.getHexProof(claimingAddress);
        setProof(hexProof);
        let mintWL = merkleTree.verify(hexProof, claimingAddress, rootHash);
        let isWhitelisted = await blockchain.smartContract.methods
          .isWhitelisted(blockchain.account,hexProof)
          .call();
       
        if (mintWL && isWhitelisted) {
          setCanMintWL(mintWL);
          setFeedback(`Welcome Whitelist Member, you can mint your NFTs`)
          setDisable(false)
        } else {
          setFeedback(`Sorry, your wallet is not on the whitelist`);
          setDisable(true);
        }

      }
    }
  };

  const getDataWithAlchemy = async () => {
    const web3 = createAlchemyWeb3("https://eth-rinkeby.alchemyapi.io/v2/r6eG6CaBZCKMgr9n_LtLiBdruY9DwF_v");
    const abiResponse = await fetch("/config/abi.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const abi = await abiResponse.json();
    var contract = new Contract(abi, '0xFe895aaf363799258EDb10Aa5e67F8bf4D3CE089');
    contract.setProvider(web3.currentProvider);
    console.log({ contract });
    // Get Total Supply
    const totalSupply = await contract.methods
      .totalSupply()
      .call();
    setTotalSupply(totalSupply);

    // Get Contract State
    let currentState = await contract.methods
      .currentState()
      .call();
    setState(currentState);
    console.log({ currentState });

    // Set Price and Max According to State

    if (currentState == 0) {
      setStatusAlert("MINT NOT LIVE YET!");
      setDisable(true);
      setDisplayCost(0.00);
      setMax(0);
    }
    else if (currentState == 1) {
      let wlCost = await contract.methods
        .costWL()
        .call();
      setDisplayCost(web3.utils.fromWei(wlCost));
      setNftCost(web3.utils.fromWei(wlCost));
      setStatusAlert("WHITELIST IS NOW LIVE!");
      setFeedback("Are you Whitelisted Member?");

      let wlMax = await contract.methods
        .maxMintAmount()
        .call();
      setMax(wlMax);
    }
    else {
      let puCost = await contract.methods
        .cost()
        .call();
      setDisplayCost(web3.utils.fromWei(puCost));
      setNftCost(web3.utils.fromWei(puCost));
      setStatusAlert("PUBLIC MINT IS LIVE!");
      let puMax = await contract.methods
        .maxMintAmount()
        .call();
      setMax(puMax);
    }

  }

  const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();
    SET_CONFIG(config);
  };

  useEffect(() => {
    getConfig();
    getDataWithAlchemy();
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  }, []);

  useEffect(() => {
    addEventListener
    getData();
  }, [blockchain.account]);

  return (
    <>
      {loading && <Loader />}
      <s.Body>
        <Navbar />
        <s.FlexContainer
          jc={"space-between"}
          ai={"center"}
          fd={"row"}
          mt={"25vh"}
        >
          <s.Image src={"config/images/1.png"} wid={"25"} />
          <s.Mint>
            <s.TextTitle color={"#fff"} size={4.0} style={{ letterSpacing: "3px" }}>
              {statusAlert}
            </s.TextTitle>
            <s.SpacerSmall />
            <s.TextSubTitle size={1.8}>
              {CONFIG.MAX_SUPPLY - supply} of {CONFIG.MAX_SUPPLY}   NFT's Available
            </s.TextSubTitle>
            <s.SpacerLarge />
            <s.SpacerLarge />

            <s.FlexContainer fd={"row"} ai={"center"} jc={"space-between"}>
              <s.TextTitle>Amount</s.TextTitle>

              <s.AmountContainer ai={"center"} jc={"center"} fd={"row"}>
                <s.StyledRoundButton
                  style={{ lineHeight: 0.4 }}
                  disabled={claimingNft ? 1 : 0}
                  onClick={(e) => {
                    e.preventDefault();
                    decrementMintAmount();
                  }}
                >
                  -
                </s.StyledRoundButton>
                <s.SpacerMedium />
                <s.TextDescription color={"var(--primary)"} size={"2.5rem"}>
                  {mintAmount}
                </s.TextDescription>
                <s.SpacerMedium />
                <s.StyledRoundButton
                  disabled={claimingNft ? 1 : 0}
                  onClick={(e) => {
                    e.preventDefault();
                    incrementMintAmount();
                  }}
                >
                  +
                </s.StyledRoundButton>
              </s.AmountContainer>

              <s.maxButton
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.preventDefault();
                  maxNfts();
                }}
              >
                MAX
              </s.maxButton>
            </s.FlexContainer>

            <s.SpacerSmall />
            <s.Line />
            <s.SpacerLarge />
            <s.FlexContainer fd={"row"} ai={"center"} jc={"space-between"}>
              <s.TextTitle>Total Price</s.TextTitle>
              <s.TextTitle color={"var(--primary)"}>{displayCost}</s.TextTitle>
            </s.FlexContainer>
            <s.SpacerSmall />
            <s.Line />
            <s.SpacerSmall />
            <s.SpacerLarge />

            {blockchain.account !== "" &&
              blockchain.smartContract !== null &&
              blockchain.errorMsg === ""
              ? (
                <s.Container ai={"center"} jc={"center"} fd={"row"}>
                  <s.connectButton
                    style={{
                      textAlign: "center",
                      color: "var(--primary-text)",
                      cursor: "pointer",
                    }}
                    disabled={disable}
                    onClick={(e) => {
                      e.preventDefault();
                      claimNFTs();
                      getData();
                    }}
                  >
                    {" "}
                    {claimingNft ? "Please Confirm Transaction in Your Wallet" : "Mint"}{" "}
                  </s.connectButton>{" "}
                </s.Container>
              ) : (
                <>
                  <s.connectButton
                    style={{
                      textAlign: "center",
                      color: "var(--primary-text)",
                      cursor: "pointer",
                    }}
                    disabled={state == 0 ? 1 : 0}
                    onClick={(e) => {
                      e.preventDefault();
                      dispatch(connectWallet());
                      getData();
                    }}
                  >
                    Connect Your Wallet
                  </s.connectButton>
                </>

              )}
            <s.SpacerLarge />
            {blockchain.errorMsg !== "" ? (
              <s.connectButton
                style={{
                  textAlign: "center",
                  color: "var(primary-text)",
                  cursor: "pointer",
                }}
              >
                {blockchain.errorMsg}
              </s.connectButton>
            ) : (
              <s.TextDescription
                style={{
                  textAlign: "center",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {feedback}
              </s.TextDescription>

            )}

            <s.SpacerLarge />
            <Social />
          </s.Mint>
          <s.Image src={"config/images/2.png"} wid={"25"} />
        </s.FlexContainer>
        <s.SpacerLarge />
      </s.Body>

    </>
  );
}

export default Home;
