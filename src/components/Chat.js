import React, { useLayoutEffect, useRef, useEffect } from "react";
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import InputBase from '@mui/material/InputBase';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { AGENT_ID, AGENT_ALIAS_ID, WELCOME_MESSAGE } from '../env';
import { v4 as uuidv4 } from 'uuid';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import {fromCognitoIdentityPool} from "@aws-sdk/credential-providers";
import { fetchAuthSession } from 'aws-amplify/auth';
import config from '../amplifyconfiguration.json';
import parse from 'html-react-parser';

const Chat = ({ loginId }) => {

    const [enabled,setEnabled] = React.useState(false);
    const [loading,setLoading] = React.useState(false);
    const [answers,setAnswers] = React.useState([]);
    const [query,setQuery] = React.useState("");
    const [sessionId,setSessionId] = React.useState(uuidv4());
    const [errorMessage,setErrorMessage] = React.useState("");
    const [height,setHeight] = React.useState(480);
    const [size, setSize] = React.useState([0, 0]);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [answers]);

    useLayoutEffect(() => {
        function updateSize() {
            setSize([window.innerWidth, window.innerHeight]);
            const myh = window.innerHeight-216;
            if (myh<346){
                setHeight(346)
            }else{
                setHeight(myh)
            }
        }
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const effectRan = React.useRef(false);
    useEffect(() => {
      if (!effectRan.current) {
        console.log("effect applied - only on the FIRST mount");
          
        const fetchData = async () => {
            console.log("Chat")
        }
        fetchData()
            // catch any error
            .catch(console.error);
      }
      return () => effectRan.current = true;
    }, []);

    const handleQuery = (event) => {
        if (event.target.value.length>0 && loading===false && query!=="")
            setEnabled(true)
        else
            setEnabled(false)
        setQuery(event.target.value.replace("\n",""))
    }

    const handleKeyPress = (event) => {
        if (event.code === "Enter" && loading===false && query!==""){
            setAnswers(prevState => [...prevState, { query: query }]);
            getAnswer(query);
        }
    }

    const handleClick = async (e) => {
        e.preventDefault();
        if (query!=""){
            setAnswers(prevState => [...prevState, { query: query }]);
            getAnswer(query);
        }
    }

    const invokeBedrockAgent = async (prompt, sessionId) => {
        console.log(sessionId)
        const authToken = (await fetchAuthSession()).tokens?.idToken?.toString();
        const my_login = 'cognito-idp.'+config.aws_project_region+'.amazonaws.com/'+config.aws_user_pools_id
        const bedrock = new BedrockAgentRuntimeClient({ 
            region: config.aws_project_region,
            credentials: fromCognitoIdentityPool({
                clientConfig: { region: config.aws_project_region },
                identityPoolId: config.aws_cognito_identity_pool_id,
                logins: { [my_login]: authToken }
            })
        });
        const command = new InvokeAgentCommand({
            agentId: AGENT_ID,
            agentAliasId: AGENT_ALIAS_ID,
            sessionId,
            inputText: prompt,
            sessionState: {
                promptSessionAttributes: {
                    loginId: loginId.substr(0, 1)=="+" ? loginId.substr(loginId.length - 10) : loginId
                }
            }
        });
        let completion = "";        
        const response = await bedrock.send(command);
        if (response.completion === undefined) {
            throw new Error("Completion is undefined");
        }
        for await (let chunkEvent of response.completion) {
            const chunk = chunkEvent.chunk;
            //console.log(chunk);
            const decodedResponse = new TextDecoder("utf-8").decode(chunk.bytes);
            completion += decodedResponse;
        }
        return completion;  
    };
    
    function removeCharFromStartAndEnd(str, charToRemove) {
        // Check if the string starts with the character
        while (str.startsWith(charToRemove)) {
          str = str.substring(1);
        }
        // Check if the string ends with the character
        while (str.endsWith(charToRemove)) {
          str = str.substring(0, str.length - 1);
        }
        return str;
    }

    const getAnswer = async (my_query) => {
        if (!loading && my_query!=""){
            setEnabled(false)
            setLoading(true)
            setErrorMessage("")
            setQuery("");
            try {
                const completion = await invokeBedrockAgent(my_query, sessionId)
                const json = {
                    completion: removeCharFromStartAndEnd(completion,'\n')
                }
                setLoading(false);
                setEnabled(false);
                setAnswers(prevState => [...prevState, json ]);
            } catch (error) {
                console.log('Call failed: ', error);
                setErrorMessage(error.toString());
                setLoading(false)
                setEnabled(true)
            }
        }
    }

    return (
    <Box sx={{ pl: 2, pr: 2, pt:0, pb:0 }}>

        { errorMessage!="" && (
            <Alert severity="error" sx={{ 
                position: "fixed",
                width: "80%",
                top: "65px",
                left: "20%",
                marginLeft: "-10%" /* Negative half of width. */
            }} onClose={() => { setErrorMessage("") }}>
            {errorMessage}</Alert>
        )}
        
        <Box
        id="chatHelper"
        sx={{
            borderRadius: "12px 12px 0px 0px",
            display: "flex",
            flexDirection: "column",
            height: height,
            overflow: "hidden",
            overflowY: "scroll",
            }}
        >
            <Typography color="primary" sx={{ fontSize: "1.1em", pb: 2, pt:2 }}>{ parse(WELCOME_MESSAGE) }</Typography>
            <Box sx={{ mb: 1 }} >
                <ul>
                {answers.map((answer, index) => (
                    <li key={"meg"+index}>
                    { answer.hasOwnProperty("completion") ? (
                        
                        <Grid>
                            <Box sx={{ 
                                borderRadius: 4, 
                                pl: 1, pr: 1, pt: 1, 
                                display: 'flex',
                                alignItems: 'left'
                            }}>
                                <Box sx={{ pr: 2 }}>
                                    <img src="/images/genai.png" width={32} height={32} />
                                </Box>
                                <Box sx={{ p:0 }}>
                                    <Typography variant="body1">
                                    {
                                    answer.completion.split("\n").map(function(item, idx) {
                                            return (
                                                <span key={idx}>
                                                    {item}
                                                    <br/>
                                                </span>
                                            )
                                        })
                                    }
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    ) : (
                        <Grid container justifyContent="flex-end" >  
                            <Box sx={{ fontSize: 15, textAlign: "right", borderRadius: 4, background: "#B2DFDB", fontWeight: 500, pt:1, pb:1, pl:2, pr: 2, mb: 1, mt: 2, mr:1 }}>
                                { answer.query }
                            </Box>
                        </Grid>
                    )}
                    </li>
                ))}
                {/* this is the last item that scrolls into
                    view when the effect is run */}
                <li ref={scrollRef} />
                </ul>
            </Box>
        </Box>

        <Paper
            component="form"
            sx={{ p: 1, mb: 2, display: 'flex', alignItems: 'center', borderRadius: 4 }}
            elevation={1}
            >

            <Box sx={{ pt:0.5 }}>
                { loading ? (
                    <CircularProgress color="primary" size={32} />
                ) : (
                    <img src="/images/genai.png" width={32} height={32} />
                )}
            </Box>

            <InputBase
                required
                id="query"
                name="query"
                placeholder="Type your question..."
                fullWidth
                multiline
                onChange={handleQuery}
                onKeyDown={handleKeyPress}
                value={query}
                variant="outlined"
                inputProps={{ maxLength: 140 }}
                sx={{ pl: 2, pr:2, fontWeight: 500 }}
            />

            <Divider sx={{ height: 32 }} orientation="vertical" />
            <IconButton color="primary" sx={{ p: 1 }} aria-label="directions" disabled={!enabled} onClick={handleClick}>
                <SendIcon />
            </IconButton>
        </Paper>
      
    </Box>
    );
};

export default Chat;