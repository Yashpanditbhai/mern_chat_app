import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext.jsx";
import { SocketContextProvider } from "./context/SocketContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { CallProvider } from "./context/CallContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<BrowserRouter>
			<ThemeProvider>
				<LanguageProvider>
					<AuthContextProvider>
						<SocketContextProvider>
							<CallProvider>
								<App />
							</CallProvider>
						</SocketContextProvider>
					</AuthContextProvider>
				</LanguageProvider>
			</ThemeProvider>
		</BrowserRouter>
	</React.StrictMode>
);
