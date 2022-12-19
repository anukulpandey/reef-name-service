import React, { useState } from "react";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import { Provider, Signer } from "@reef-defi/evm-provider";
import { WsProvider } from "@polkadot/rpc-provider";
import { Contract } from "ethers";
import greeterContract from "./contracts/Greeter.json";
import Uik from "@reef-defi/ui-kit";
import fromExponential from 'from-exponential';
import { ApiPromise } from '@polkadot/api';
import { options } from '@reef-defi/api';
import { SocialIcon } from 'react-social-icons';
import { faRightFromBracket ,faGear,faBolt,faEarthAmerica,faPlay} from "@fortawesome/free-solid-svg-icons";

const FactoryAbi = greeterContract.abi;
const factoryContractAddress = greeterContract.address;



function App() {
	const [balance, setBalance] = useState("");
	const [signer, setSigner] = useState();
	const [isWalletConnected, setWalletConnected] = useState(false);
	const [value, setValue] = useState("")
	const [amount, setAmount] = useState("")
	const [wallet, setWallet] = useState("")
	const [balanceStatus, setBalanceStatus] = useState(true)
	const [submitStatus, setSubmitStatus] = useState(false)
	const [loadingBtn, setLoadingBtn] = useState(false)
	const [isOpen, setOpen] = useState(false)
	const [yourRNS, setYourRNS] = useState(".rns");
	const [rns, setRNS] = useState("");
	const [newRns, setNewRNS] = useState("");
	const [URL, setURL] = useState("wss://rpc-testnet.reefscan.com/ws");

	const checkExtension = async () => {
		setLoadingBtn(true);
		let allInjected = await web3Enable("Reef");


		if (allInjected.length === 0) {
			return false;
		}

		let injected;
		if (allInjected[0] && allInjected[0].signer) {
			injected = allInjected[0].signer;
		}

		const evmProvider = new Provider({
			provider: new WsProvider(URL),
		});

		evmProvider.api.on("ready", async () => {
			const allAccounts = await web3Accounts();

			allAccounts[0] &&
				allAccounts[0].address &&
				setWalletConnected(true);

			console.log(allAccounts);
			setWallet(allAccounts[0].address)

			const wallet = new Signer(
				evmProvider,
				allAccounts[0].address,
				injected
			);

			yourBalance(wallet)

			if (!(await wallet.isClaimed())) {
				console.log(
					"No claimed EVM account found -> claimed default EVM account: ",
					await wallet.getAddress()
				);
				await wallet.claimDefaultAccount();
			}

			setSigner(wallet);
		});
	};
	const rnsValidator = (str)=>{
		const not_allowed = [' ','/',"\"",","]
		for(let i = 0;i<str.length;i++){
			if(not_allowed.includes(str[i])){
				return false;
			}
		}
		return true;
	}

	const modalFunc = async ()=>{
		setOpen(true);
		await checkSigner()	
		const factoryContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);
		try {
			const txResult = await factoryContract.getYourRNS();
			console.log(txResult);
			if(String(txResult).length===0){
				setYourRNS("You haven't claimed RNS till now. Claim it now!")
			}else{
				setYourRNS(String(txResult))
			}
		} catch (error) {
			console.log(error);
		}
	}

	const checkSigner = async () => {
		if (!signer) {
			await checkExtension();
		}
		return true;
	};

	const yourBalance = async (wallet) => {

		try {
			var data = (await wallet.getBalance()) / 10 ** 18
			setBalance(parseFloat(data).toFixed(2))
		} catch (e) {
			console.log(e)
			setBalanceStatus(false)
		}
	};

	const makeTransaction = async () => {

		setSubmitStatus(true)
		let _toSend = amount;
		_toSend = fromExponential(parseInt(parseInt(_toSend)) * 10 ** 18)


		await checkSigner();
		const factoryContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);


		try {
			if(String(value).includes("reef")){
				if(!rnsValidator(value)){
					Uik.notify.danger('Invalid RNS!');
				
				}
				const txResult = await factoryContract.rnsTransfer((value.split("."))[0],{ value: _toSend });
				console.log(txResult)
				console.log(_toSend)
				yourBalance(signer)
			}else{
				let addr = (await getEvmAddress(value));
				console.log(value.length)
				const txResult = await factoryContract.makeTransfer(addr,{ value: _toSend });
				console.log(txResult)
				console.log(_toSend)
				yourBalance(signer)
			}

			Uik.notify.success('Your transaction went successfully!')
		} catch (e) {

			if ((String(e)).includes('Cancelled')) {
				Uik.notify.danger('Transaction was cancelled by user!')

			}
			else {
				Uik.notify.danger('Some error occured!')
				console.log(e)
			}
		}

		setSubmitStatus(false)
	}

	const handleClaim = async()=>{
		await checkSigner();

		const factoryContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);

		if(!rnsValidator(rns)){
			Uik.notify.danger('Invalid RNS!');
			return;
		}

		try {
			if(String(rns).includes(".reef")){
				const validator = await factoryContract.isRNSRegistered(rns);
				if(validator===true){
					Uik.notify.danger('This RNS is already in use!')
				}else{
					const txResult = await factoryContract.registerRNS(rns);
					console.log(txResult)
					Uik.notify.success('Successfully claimed the RNS!')
				}
			}
			else{
				Uik.notify.danger('RNS must contain .reef at end!')
			}
			
			
		} catch (e) {

			if ((String(e)).includes('Cancelled')) {
				Uik.notify.danger('Transaction was cancelled by user!')

			}
			else {
				Uik.notify.danger('Some error occured!')
				console.log(e)
			}
		}
	}
	const changeRNS = async()=>{
		await checkSigner();

		const factoryContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);
		console.log(rnsValidator(newRns))

		if(!rnsValidator(newRns)){
			Uik.notify.danger('Invalid RNS!');
			return;
		}
		try {
			if(String(newRns).includes(".reef")){
				const validator = await factoryContract.isRNSRegistered(newRns);
				if(validator===true){
					Uik.notify.danger('This RNS is already in use!')
				}else{
					const txResult = await factoryContract.changeRNS(yourRNS,newRns);
					console.log(txResult)
					Uik.notify.success('Successfully changed the RNS!')
				}
			}
			else{
				Uik.notify.danger('RNS must contain .reef at end!')
			}	
		} catch (e) {

			if ((String(e)).includes('Cancelled')) {
				Uik.notify.danger('Transaction was cancelled by user!')

			}
			else {
				Uik.notify.danger('Some error occured!')
				console.log(e)
			}
		}
		await refreshRNS();
	}

	const getEvmAddress = async (walletAddy) => {
		const provider = new WsProvider(URL);
		const api = new ApiPromise(options({ provider }));
		await api.isReady;
		const data = await api.query.evmAccounts.evmAddresses(walletAddy);
		return (data.toHuman())
	}

	const disconnect = () => {
		setBalance("")
		setSigner()
		setWalletConnected(false)
		setWallet("")
		setValue("")
		setBalanceStatus(true)
		setSubmitStatus(false)
		Uik.notify.success('Wallet disconnected successfully!')
	}


	const refreshRNS  = async ()=>{
		await checkSigner()	
		const factoryContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);
			const txResult = await factoryContract.getYourRNS();
			console.log(txResult);
			setYourRNS(String(txResult));
	}
	return (
		<Uik.Container className="main">
			<Uik.Container vertical>
				<Uik.Container>
				<Uik.ReefLogo />
			<Uik.Text text='Name Service' type='headline'/>
				</Uik.Container>
				<Uik.Text text='
				Claim free .reef domain today!
				' type='light'/>
				<Uik.Bubbles />

				{isWalletConnected ? (
					<Uik.Container vertical className="container">
						{
							balance !== '' ? (
								<>
									<Uik.Container className="navbar">
									<Uik.ReefTestnetLogo className="logoLeft" />
				<Uik.Container flow="end" >
										<Uik.ReefAmount value={balance} />
					<Uik.Button size='small' icon={faGear}  onClick={modalFunc} />
					<Uik.Button size='small' icon={faRightFromBracket} className="Disconnect" onClick={disconnect} />
				</Uik.Container>
									</Uik.Container>
									<Uik.Divider text='Make Transaction 💸' className="divider" />
									<Uik.Input
										placeholder="0xanukul.reef or 5HBiZruqeituNEQU2hC6C3oi57CgmNdpBp5r7KVETZFxuY1G"
										className="inputBox"
										value={value}
										onInput={e => {
											setValue(e.target.value)
										}}
									/>

									{submitStatus ? (
										<>
											<Uik.Loading />
										</>
									) : (
										<Uik.Container>
											<Uik.Input
										placeholder="50"
										className="inputBox"
										value={amount}
										onInput={e => {
											setAmount(e.target.value)
										}}
										
									/>
									 <Uik.Modal
    title='Settings'
    isOpen={isOpen}
    onClose={() => setOpen(false)}
    onOpened={() => {}}
    onClosed={() => {}}
    footer={
      <>
        {/* <Uik.Button text='Close' onClick={() => setOpen(false)}/> */}
        <Uik.Button text='Close' fill onClick={() => setOpen(false)}/>
      </>
    }
  >
    
	{yourRNS==="You haven't claimed RNS till now. Claim it now!"?
	<>
	<Uik.Text>{yourRNS}</Uik.Text>
	<Uik.Divider text='Claim RNS' className="divider" />
	<Uik.Container>

	<Uik.Input placeholder="0xanukul.reef" value={rns} onChange={(e)=>setRNS(e.target.value)} />
	<Uik.Button text='Claim' size='small' icon={faEarthAmerica} onClick={handleClaim}/>
	</Uik.Container>
	</>:<>
	<Uik.Container flow='start'>
	<Uik.Text text='Your have claimed this RNS: ' type='light'/>
	<Uik.Container  flow='start'>
	<Uik.Tag text={yourRNS}/>
	</Uik.Container>
	</Uik.Container>
	<Uik.Divider text='Change RNS' />
	<Uik.Container>
	<Uik.Input placeholder="bandar.reef" value={newRns} onChange={(e)=>setNewRNS(e.target.value)} />
	<Uik.Button text='Change' size='small' icon={faBolt} onClick={changeRNS}/>
	</Uik.Container>
	</>
	
}
  </Uik.Modal>
											<Uik.Button
												text="Send 🚀"
												onClick={makeTransaction}
											/>

										

										</Uik.Container>
									)}


									
								</>
							) : (<>
								{balanceStatus ? (
									<>
										<Uik.Button text='Button' loading size='small' loader='fish' />
										
									</>
								) : (
									<>
										<Uik.Tag color="red" text="An error has occurred. Please refresh the page" />
									</>
								)}
							</>
							
							)}
							<Uik.Divider text="" />
							<Uik.Container>

<Uik.Text text='Built with ❤️‍🔥 by 0xanukul' type='mini' className="social" />
						<Uik.Container>
							<SocialIcon url="https://twitter.com/0xanukul" style={{ height: 25, width: 25 }} />
							<SocialIcon url="https://github.com/anukulpandey" style={{ height: 25, width: 25 }} />
							<SocialIcon url="https://www.youtube.com/@anukulpandey8116" style={{ height: 25, width: 25 }} />

						</Uik.Container>
							</Uik.Container>
					</Uik.Container>
				) : (
					<>
						{loadingBtn ? <>
							<Uik.Button text='Button' loading size='small' loader='fish' />
						</> : <div className="">
						<Uik.Container vertical flow="start">
						<Uik.Text text='Introduction' type='lead'/>
						<Uik.Container className="container" vertical>
						<Uik.Text text='RNS is your web3 username, a readable name for your REEF Chain address, and decentralised websites.' type='light'/>
						<Uik.Text text='The native name suffix for RNS is .REEF, which has the full security benefits of being blockchain-native. You can also use RNS with DNS names you already own in future.' type='light'/>
					
						</Uik.Container>
						<Uik.Text text='How to use this dApp?' type='lead'/>
						<Uik.Container className="container" vertical>
						
						<Uik.Text text='Click on ⚙️ icon at top right. You can either claim a RNS for free (Just need to pay gas fees) or you can change RNS later.' type='light'/>
						<Uik.Text text='As of now you can transfer REEF20 tokens to any address or RNS. With transaction fee of 1.51 REEFs only.' type='light'/>
				
						</Uik.Container>
							<Uik.Button
								text="Start"
								icon={faPlay}
								onClick={checkExtension}
						
							/>
							</Uik.Container>
							</div>}

						<Uik.Text text='Built with ❤️‍🔥 by 0xanukul 🐒' type='mini' className="social" />
						<Uik.Container>
							<SocialIcon url="https://twitter.com/0xanukul" style={{ height: 25, width: 25 }} />
							<SocialIcon url="https://github.com/anukulpandey" style={{ height: 25, width: 25 }} />
							<SocialIcon url="https://www.youtube.com/@anukulpandey8116" style={{ height: 25, width: 25 }} />

						</Uik.Container>
					</>
				)}
			</Uik.Container>
		</Uik.Container>
	);
}

export default App;