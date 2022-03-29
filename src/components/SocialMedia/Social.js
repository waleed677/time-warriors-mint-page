import React from "react";
import { NavLink , NavIcon , NavItems } from "./Social.elements";

function Social() {

    const socialMedia = (url) => {
        window.location.href = url;
      };

  return (
    <>
         <div className="flexContainer">
             <div className="flexItems">
             <a href="https://www.instagram.com/twistedbearsnft/" target="_blank"> <img src={"config/images/instagram.png"}  /></a>
             </div>
             <div className="flexItems">
             <a href="https://twitter.com/twistedbears_" target="_blank"><img src={"config/images/twitter.png"}  /></a>
             </div>
             <div className="flexItems">
             <a href="https;//discord.gg/twistedbears" target="_blank"> <img src={"config/images/discord.png"} /></a>
             </div>
         </div>
    </>
  )
}

export default Social