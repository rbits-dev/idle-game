"use strict";

const Web3Modal = window.Web3Modal.default;
const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;
const WalletConnectProvider = window.WalletConnectProvider.default;

let nftContract;

let provider;
let web3Modal;
let selectedAccount = null;
var web3;
var myTimeout;


function init() {

  if(location.protocol !== 'https:') {
    console.log("Do not connect with your wallet in a non secure environment.");
    window.location.href = 'https://moonarcade.games';
    window.location.reload(); 
    return;
  }

  const providerOptions = {
    
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: {
          1: 'https://mainnet.infura.io/v3/',
          56: 'https://bsc-dataseed.binance.org/',
          1285: 'https://rpc.api.moonriver.moonbeam.network',
          137: 'https://rpc-mainnet.maticvigil.com',
        },
      }
    },

  };

  web3Modal = new Web3Modal(
    {
      theme: "dark",
      cacheProvider: false, // optional
      providerOptions, // required
      disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
    }
  );

  web3Modal.updateTheme({
    background: "rgba(0, 0, 0, 0.5)",
    main: "rgb(199, 199, 199)",
    secondary: "rgb(136, 136, 136)",
    border: "rgba(195, 195, 195, 0.14)",
    hover: "rgb(16, 26, 32)"
  });

}
const balanceOfABI = [
  {
      "constant": true,
      "inputs": [
          {
              "name": "_owner",
              "type": "address"
          }
      ],
      "name": "balanceOf",
      "outputs": [
          {
              "name": "balance",
              "type": "uint256"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
];

async function newRequest() {
  let url = 'https://moonboxes.io/api/api/userData?NSFW=undefined&userAddress=' + selectedAccount;

  const response = await fetch( url, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'APPKEY': 'mTb+T!5!crBEQEL2!$PJ9&JSjeT3M6Hs*RytA-eaDSBS5UU@8-fCJHu6F?kp@s+JTu2-_-V8L#?5',
      'blockchainId': await web3.eth.getChainId()
    },
    redirect: 'follow',
    
  }).then( (response) => {
    if( response.status >= 400 && response.status < 600) {
      displayText("Oops try again later");
      playSound( errorSound(0) );
      return null;
    }
    return response;
  }).then( (returnedResponse) => {
    return returnedResponse.json();
  }).catch( (error) => {
     displayText("Oops try again much later");
     playSound( errorSound(1) );
  });
  return response;
  //return response.json();
}

async function fetchAccountData() {
  const chainId = await web3.eth.getChainId();
  const chainData = evmChains.getChain(chainId);
  const accounts = await web3.eth.getAccounts();
  selectedAccount = accounts[0];
  document.querySelector("#prepare").style.display = "none";
  document.querySelector("#connected").style.display = "block";

  //demoMode();

  getMyNFTs();
}

async function refreshAccountData() {
  document.querySelector("#connected").style.display = "block";
  document.querySelector("#prepare").style.display = "none";
  document.querySelector("#introtext").style.display = "none";
  document.querySelector("#starttext").style.display = "block";

  document.querySelector("#btn-connect").setAttribute("disabled", "disabled");
  await fetchAccountData(provider);
  document.querySelector("#btn-connect").removeAttribute("disabled");
}

function resolveSpriteMap( info, name , uri ) {
  let m = getMetadataSpriteMap( info, name );
  
  if( m == null ) {
    return uri;
  }
  
  return m.uri;
}

function printError(err, printAddress) {
  if(printAddress) {
    let walletAddress = document.getElementById("selectedAccount");
    walletAddress.textContent = selectedAccount;
  }
  let errorMsg = document.getElementById("errormsg");
  errorMsg.textContent = err;
  noShips.classList.remove('hidden');
  haveShips.classList.add('hidden');
}

async function demoMode() {

  let options = new Object();
  let loadingShip = false;

  shipyard = [];
  ship = undefined;

  let nships = getNumShips();
  for( let i = 1 ; i < nships; i ++ ) {
    let lp = "https://moonboxes.io/api/nft/images/raiders/" + i + ".webp";

    let info = getMetadata( lp );

    console.log( "NFT: " + lp );

    let cols = getMetadataSpriteMap( info, "spaceship").columns;
    // spaceship and lasers are always present
    options.spaceship = getMetadataSpriteMap( info, "spaceship").uri;
    options.lasers = getMetadataSpriteMap(info, "lasers").uri;

    // optional elements
    options.moveLeft = resolveSpriteMap( info, "left", options.spaceship.uri );
    options.moveRight = resolveSpriteMap( info, "right", options.spaceship.uri);
    options.warning = resolveSpriteMap(info, "warn", options.spaceship.uri);
    options.idle = resolveSpriteMap(info, "idle", options.spaceship.uri );

    options.power = info.power;
    options.speed = info.speed;
    options.rockets = info.rockets;
    options.firespeed = info.firespeed;
    options.title = info.title;
    options.scale = info.scale;

    loadSpaceShipExternal( options, cols );
    loadingShip = true;
  }

  let haveShips = document.getElementById("shipyard");
  let noShips = document.getElementById("noships");
  let selectShip = document.getElementById("moreships2");
  let pager = document.getElementById("moreships");

  if( loadingShip ) {
   cycleShips(0);
   selectSpaceShip();
   haveShips.classList.remove('hidden');
   noShips.classList.add('hidden');

   if( shipyard.length > 1 ) {
     pager.classList.remove("hidden");
     selectShip.classList.remove("hidden");
   }
   else {
     pager.classList.add("hidden");
     selectShip.classList.add("hidden");
   }
  }
}


async function getMyNFTs() {


  shipyard = [];
  ship = undefined;


  newRequest().then( data => { 
    if( data == null ) {
      printError("Server Error. Please try again later.");
      return;
    }
    let arr = data.data;
    let options = new Object();
    let loadingShip = false;
    for( const d of arr.data ) {
      if( d.ArtistNFTAddress !== '0x36BB868f0D65E73fCBA05cc0D7771a8b4CBe4E3e' ) {
        continue;
      }

      let props = d.properties;
      let info = getMetadata( d.logo_path );

      console.log( "NFT: " + d.logo_path );
      
      let cols = getMetadataSpriteMap( info, "spaceship").columns;
      // spaceship and lasers are always present
      options.spaceship = getMetadataSpriteMap( info, "spaceship").uri;
      options.lasers = getMetadataSpriteMap(info, "lasers").uri;

      // optional elements
      options.moveLeft = resolveSpriteMap( info, "left", options.spaceship.uri );
      options.moveRight = resolveSpriteMap( info, "right", options.spaceship.uri);
      options.warning = resolveSpriteMap(info, "warn", options.spaceship.uri);
      options.idle = resolveSpriteMap(info, "idle", options.spaceship.uri );

      options.power = info.power;
      options.speed = info.speed;
      options.rockets = info.rockets;
      options.firespeed = info.firespeed;
      options.title = info.title;

      loadSpaceShipExternal( options, cols );
      loadingShip = true;
     }

     let haveShips = document.getElementById("shipyard");
     let noShips = document.getElementById("noships");
     let selectShip = document.getElementById("moreships2");
     let pager = document.getElementById("moreships");
     
     if( loadingShip ) {
      cycleShips(0);
      selectSpaceShip();
      haveShips.classList.remove('hidden');
      noShips.classList.add('hidden');

      if( shipyard.length > 1 ) {
        pager.classList.remove("hidden");
        selectShip.classList.remove("hidden");
      }
      else {
        pager.classList.add("hidden");
        selectShip.classList.add("hidden");
      }

     }
     else {
       printError("Error: No starfighters found for", true);
     }
  });

}

async function onConnect() {

  try {
    provider = await web3Modal.connect();
    web3 = new Web3(provider);
  } catch(e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  provider.on("accountsChanged", (accounts) => {
    fetchAccountData();
  });

  provider.on("chainChanged", (chainId) => {
    if(chainId == 1) {
      fetchAccountData();
    }
  });

  provider.on("networkChanged", (networkId) => {
    fetchAccountData();
  });

  await refreshAccountData();

  nftContract = new web3.eth.Contract(
    [{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"lootboxaddress","type":"address"},{"internalType":"address","name":"swapAddress","type":"address"},{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_symbol","type":"string"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"address","name":"minter","type":"address"},{"indexed":false,"internalType":"bool","name":"status","type":"bool"}],"name":"SetMinter","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"indexed":false,"internalType":"uint256[]","name":"values","type":"uint256[]"}],"name":"TransferBatch","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"TransferSingle","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"string","name":"value","type":"string"},{"indexed":true,"internalType":"uint256","name":"id","type":"uint256"}],"name":"URI","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"string","name":"newuri","type":"string"}],"name":"UpdateUri","type":"event"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"accounts","type":"address[]"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"}],"name":"balanceOfBatch","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"name":"burnBatch","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"isMinted","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"isMinter","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"name":"mintBatch","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeBatchTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"minter","type":"address"},{"internalType":"bool","name":"status","type":"bool"}],"name":"setMinter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"newuri","type":"string"}],"name":"updateUri","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"uri","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}],
    "0x36BB868f0D65E73fCBA05cc0D7771a8b4CBe4E3e");


    setConnected(true);

    stopAndPlayLooping("sid0");

}

async function onDisconnect() {

  clearTimeout(myTimeout);

  if(provider.close) {
    await provider.close();
    await web3Modal.clearCachedProvider();
    provider = null;
  }

  selectedAccount = null;

  document.querySelector("#prepare").style.display = "block";
  document.querySelector("#connected").style.display = "none";
  document.querySelector("#introtext").style.display = "block";
  document.querySelector("#starttext").style.display = "none";


  setConnected(false);
}

window.addEventListener('load', async () => {
  init();
  document.querySelector("#btn-connect").addEventListener("click", onConnect);
  document.querySelector("#btn-disconnect").addEventListener("click", onDisconnect);
});