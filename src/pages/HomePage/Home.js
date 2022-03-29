import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "../../redux/blockchain/blockchainActions";
import { connectWallet } from "../../redux/blockchain/blockchainActions";
import { fetchData } from "./../../redux/data/dataActions";
import { StyledRoundButton } from "./../../components/styles/styledRoundButton.styled";
import * as s from "./../../styles/globalStyles";
import Navbar from "../../components/Navbar/Navbar";
import HeroSection from "../../components/HeroSection/HeroSection";
import Social from "../../components/SocialMedia/Social";
import Video from "../../components/Video/Video";

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
    let cost = 0;
    let gasLimit = CONFIG.GAS_LIMIT;
    let totalCostWei = String(cost * mintAmount);
    let totalGasLimit = String(gasLimit * mintAmount);
    setFeedback(`Minting your ${CONFIG.NFT_NAME}`);
    setClaimingNft(true);
    setDisable(true);
    blockchain.smartContract.methods
      .mint(mintAmount)
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
      })
      .then((receipt) => {
        setMintDone(true);
        setFeedback(`Done , ${CONFIG.NFT_NAME} Is Yours!`);
        setClaimingNft(false);
        blockchain.smartContract.methods
          .totalSupply()
          .call()
          .then((res) => {
            setTotalSupply(res);
          });

        dispatch(fetchData(blockchain.account));
      });
  };

  const decrementMintAmount = () => {
    let newMintAmount = mintAmount - 1;
    if (newMintAmount < 1) {
      newMintAmount = 1;
    }

    setMintAmount(newMintAmount);
    if(state == 1){
        setDisplayCost(parseFloat(CONFIG.DISPLAY_COST_WL * newMintAmount).toFixed(3));
    }else{
        setDisplayCost(parseFloat(CONFIG.DISPLAY_COST_PU * newMintAmount).toFixed(3));
    }
  };

  const incrementMintAmount = () => {
    let newMintAmount = mintAmount + 1;
    if (newMintAmount > 10) {
      newMintAmount = 10;
    }
    setMintAmount(newMintAmount);
    if(state == 1){
      setDisplayCost(parseFloat(CONFIG.DISPLAY_COST_WL * newMintAmount).toFixed(3));
  }else{
      setDisplayCost(parseFloat(CONFIG.DISPLAY_COST_PU * newMintAmount).toFixed(3));
  }
  };

  const maxNfts = () => {
    if (state == 1) {
      setMintAmount(CONFIG.MAX_LIMIT);
      setDisplayCost(
        parseFloat(CONFIG.DISPLAY_COST_WL * CONFIG.MAX_LIMIT).toFixed(3)
      );
    } else {
      setMintAmount(CONFIG.MAX_LIMIT);
      setDisplayCost(parseFloat(CONFIG.DISPLAY_COST_PU * CONFIG.MAX_LIMIT).toFixed(3));
    }
  };

  const getData = async () => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
      dispatch(fetchData(blockchain.account));
      const totalSupply = await blockchain.smartContract.methods
        .totalSupply()
        .call();
      setTotalSupply(totalSupply);
      let currentState = await blockchain.smartContract.methods
        .currentState()
        .call();
      console.log({ currentState });
      setState(currentState);

    if (currentState == 1) {
        let mintWL = await blockchain.smartContract.methods
          .isWhitelisted(blockchain.account)
          .call();
          console.log({ mintWL });
        setCanMintWL(mintWL);
        (mintWL) ? "" : setFeedback(`This wallet is not on the Whitelist`);
        (mintWL) ? setDisable(false) : setDisable(true);

        setDisplayCost(CONFIG.DISPLAY_COST_WL);
      } else {
        setDisplayCost(CONFIG.DISPLAY_COST_PU);
      }
    }
  };

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
  }, []);

  useEffect(() => {
    getData();
  }, [blockchain.account]);

  return (
    <>

      <s.Body>
        <Navbar />
        <s.FlexContainer
          jc={"space-evenly"}
          ai={"center"}
          fd={"row"}
          mt={"25vh"}
        >
          <s.Mint>
            <s.TextTitle size={6.0} style={{ letterSpacing: "3px" }}>
              MINT NOW
            </s.TextTitle>
            <s.SpacerSmall />
            <s.TextSubTitle size={1.4}>
              {CONFIG.MAX_SUPPLY - supply} of {CONFIG.MAX_SUPPLY}   NFT's Available
            </s.TextSubTitle>
            <s.SpacerLarge />
            <s.SpacerLarge />

            <s.FlexContainer fd={"row"} ai={"center"} jc={"space-between"}>
              <s.TextTitle>Amount</s.TextTitle>

              <s.AmountContainer ai={"center"} jc={"center"} fd={"row"}>
                <StyledRoundButton
                  style={{ lineHeight: 0.4 }}
                  disabled={claimingNft ? 1 : 0}
                  onClick={(e) => {
                    e.preventDefault();
                    decrementMintAmount();
                  }}
                >
                  -
                </StyledRoundButton>
                <s.SpacerMedium />
                <s.TextDescription color={"var(--primary)"} size={"2.5rem"}>
                  {mintAmount}
                </s.TextDescription>
                <s.SpacerMedium />
                <StyledRoundButton
                  disabled={claimingNft ? 1 : 0}
                  onClick={(e) => {
                    e.preventDefault();
                    incrementMintAmount();
                  }}
                >
                  +
                </StyledRoundButton>
              </s.AmountContainer>

              <s.maxButton
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.preventDefault();
                  maxNfts();
                }}
              >
                Max
              </s.maxButton>
            </s.FlexContainer>

            <s.SpacerSmall />
            <s.Line />
            <s.SpacerLarge />
            <s.FlexContainer fd={"row"} ai={"center"} jc={"space-between"}>
              <s.TextTitle>Total</s.TextTitle>
              <s.TextTitle color={"var(--primary)"}>{displayCost}</s.TextTitle>
            </s.FlexContainer>
            <s.SpacerSmall />
            <s.Line />
            <s.SpacerSmall />
            <s.SpacerLarge />
            {blockchain.account !== "" && blockchain.smartContract !== null && blockchain.errorMsg === ""
              && canMintWL === true && state == 1
            ? (
              <s.Container ai={"center"} jc={"center"} fd={"row"}>
                <s.connectButton
                  disabled={disable}
                  onClick={(e) => {
                    e.preventDefault();
                    claimNFTs();
                    getData();
                  }}
                >
                  {" "}
                  {claimingNft ? "Please Confirm the Transaction in Your Wallet" : "Mint"}{" "}
                  {mintDone ? feedback : ""}{" "}
                </s.connectButton>{" "}
              </s.Container>
            ) : (
              <>
                {/* {blockchain.errorMsg === "" ? ( */}
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
                {/* ) : ("")} */}
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
              ""

            )}

            {(state !== -1 ) && (state === 0) ? (
              <s.connectButton
                style={{
                  textAlign: "center",
                  color: "var(--primary-text)",
                  cursor: "pointer",
                }}
              >
                {feedback}
              </s.connectButton>
            ) : (
              ""

            )}

            {(canMintWL !== true) && (state == 1) ? (
              <s.connectButton
                style={{
                  textAlign: "center",
                  color: "var(--primary-text)",
                  cursor: "pointer",
                }}
              >
                {feedback}
              </s.connectButton>
            ) : (
              ""

            )}
            <Social />
          </s.Mint>
        </s.FlexContainer>
        <s.SpacerLarge />
      </s.Body>

    </>
  );
}

export default Home;
