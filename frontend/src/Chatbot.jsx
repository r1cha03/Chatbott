import { useState, useRef, useEffect } from "react";
import { Send, Database, MessageCircle, Sparkles, Copy, Download, Settings, History, User, Bot, AlertCircle, CheckCircle, Loader, Code, Table } from "lucide-react";
import axios from "axios";

function ChatBot() {
    const [input, setInput] = useState("");
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    //const [activeTab, setActiveTab] = useState("chat");
    const [theme, setTheme] = useState("dark");
    const chatRef = useRef(null);
    const inputRef = useRef(null);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = input;
        const newHistory = [...history, {
            user: userMessage,
            timestamp: new Date().toISOString(),
            id: Date.now()
        }];
        setHistory(newHistory);
        setInput("");
        setIsLoading(true);
        setIsTyping(true);

        try {
            const res = await axios.post("http://localhost:8000/ask", {
                prompt: userMessage
            }, {
                timeout: 30000,
                headers: { 'Content-Type': 'application/json' }
            });

            let botResponse;

            if (res.data.error) {
                botResponse = {
                    error: res.data.error,
                    sql: res.data.sql
                };
            } else {
                botResponse = {
                    sql: res.data.sql,
                    result: res.data.result,
                    executionTime: "Query executed successfully",
                    rowCount: Array.isArray(res.data.result) ? res.data.result.length : 0
                };
            }

            setHistory([...newHistory, {
                bot: botResponse,
                timestamp: new Date().toISOString(),
                id: Date.now() + 1
            }]);
        } catch (err) {
            let errorMessage = "Server error. Please try again.";

            if (err.code === 'ECONNREFUSED') {
                errorMessage = "Cannot connect to server. Make sure the backend is running on port 8000.";
            } else if (err.code === 'ECONNABORTED') {
                errorMessage = "Request timed out. The query might be too complex.";
            } else if (err.response) {
                errorMessage = `Server error: ${err.response.status} - ${err.response.data?.error || err.response.statusText}`;
            } else if (err.message) {
                errorMessage = `Network error: ${err.message}`;
            }

            setHistory([...newHistory, {
                bot: { error: errorMessage },
                timestamp: new Date().toISOString(),
                id: Date.now() + 1
            }]);
        } finally {
            setIsLoading(false);
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const formatJson = (obj) => {
        return JSON.stringify(obj, null, 2);
    };

    const clearHistory = () => {
        setHistory([]);
    };

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [history, isTyping]);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    return (
        <div className={`min-h-screen transition-all duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
            {/* Header */}
            <div className={`border-b backdrop-blur-xl sticky top-0 z-50 ${theme === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'} shadow-lg`}>
                                <Database className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    SQL Assistant
                                </h1>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                            >
                                {theme === 'dark' ? '☀️' : '🌙'}
                            </button>
                            <button
                                onClick={clearHistory}
                                className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                            >
                                <History className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className={`lg:col-span-1 space-y-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        <div className={`rounded-2xl p-6 shadow-xl backdrop-blur-lg ${theme === 'dark' ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'}`}>
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setInput("Show me all tables in the database")}
                                    className={`w-full text-left p-3 rounded-lg transition-all ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                >
                                    Show all tables
                                </button>
                                <button
                                    onClick={() => setInput("Show me the most recent 10 records")}
                                    className={`w-full text-left p-3 rounded-lg transition-all ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                >
                                    Recent records
                                </button>
                                <button
                                    onClick={() => setInput("Count all records by category")}
                                    className={`w-full text-left p-3 rounded-lg transition-all ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                >
                                    Count by category
                                </button>
                            </div>
                        </div>

                        <div className={`rounded-2xl p-6 shadow-xl backdrop-blur-lg ${theme === 'dark' ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'}`}>
                            <h3 className="text-lg font-semibold mb-4">Examples</h3>
                            <div className="space-y-3 text-sm">
                                <div
                                    onClick={() => setInput("Show me all users from last week")}
                                    className={`p-3 rounded-lg cursor-pointer transition-all ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                                >
                                    "Show me all users from last week"
                                </div>
                                <div
                                    onClick={() => setInput("Count orders by status")}
                                    className={`p-3 rounded-lg cursor-pointer transition-all ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                                >
                                    "Count orders by status"
                                </div>
                                <div
                                    onClick={() => setInput("Find duplicate emails")}
                                    className={`p-3 rounded-lg cursor-pointer transition-all ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                                >
                                    "Find duplicate emails"
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="lg:col-span-3">
                        <div className={`rounded-2xl shadow-2xl backdrop-blur-lg ${theme === 'dark' ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} overflow-hidden`}>
                            {/* Chat Header */}
                            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50/50'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Database Connected
                                        </span>
                                    </div>
                                    <div className="flex space-x-1">
                                        <div className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                        <div className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                        <div className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                ref={chatRef}
                                className={`h-96 overflow-y-auto p-6 space-y-6 ${theme === 'dark' ? 'bg-gray-900/20' : 'bg-gray-50/30'}`}
                            >
                                {history.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                                            <MessageCircle className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                                        </div>
                                        <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Start a conversation
                                        </h3>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                            Ask me anything about your database
                                        </p>
                                    </div>
                                )}

                                {history.map((msg, idx) => (
                                    <div key={msg.id || idx} className="space-y-4">
                                        {msg.user && (
                                            <div className="flex justify-end">
                                                <div className="flex items-start space-x-3 max-w-3xl">
                                                    <div className={`rounded-2xl px-4 py-3 shadow-lg ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <User className="w-4 h-4" />
                                                            <span className="text-sm font-medium">You</span>
                                                        </div>
                                                        <p className="text-sm leading-relaxed">{msg.user}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {msg.bot && (
                                            <div className="flex justify-start">
                                                <div className="flex items-start space-x-3 max-w-4xl w-full">
                                                    <div className={`rounded-2xl px-4 py-3 shadow-lg w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center space-x-2">
                                                                <Bot className="w-4 h-4 text-green-500" />
                                                                <span className="text-sm font-medium">SQL Assistant</span>
                                                            </div>
                                                            {msg.bot.executionTime && (
                                                                <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                                                    {msg.bot.executionTime}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {msg.bot.error ? (
                                                            <div className="flex items-start space-x-2 text-red-500">
                                                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                                <p className="text-sm">{msg.bot.error}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                {msg.bot.sql && (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center space-x-2">
                                                                                <Code className="w-4 h-4" />
                                                                                <span className="text-sm font-medium">Generated SQL</span>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => copyToClipboard(msg.bot.sql)}
                                                                                className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
                                                                            >
                                                                                <Copy className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                        <div className={`p-3 rounded-lg font-mono text-sm overflow-x-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                                                            {msg.bot.sql}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {msg.bot.result && Array.isArray(msg.bot.result) && msg.bot.result.length > 0 && (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center space-x-2">
                                                                                <Table className="w-4 h-4" />
                                                                                <span className="text-sm font-medium">
                                                                                    Results ({msg.bot.rowCount} rows)
                                                                                </span>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => copyToClipboard(formatJson(msg.bot.result))}
                                                                                className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
                                                                            >
                                                                                <Download className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                        <div className={`overflow-x-auto rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                                                            <table className="min-w-full text-sm">
                                                                                <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                                                                    <tr>
                                                                                        {Object.keys(msg.bot.result[0] || {}).map(key => (
                                                                                            <th key={key} className="px-3 py-2 text-left font-medium">
                                                                                                {key}
                                                                                            </th>
                                                                                        ))}
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {msg.bot.result.map((row, i) => (
                                                                                        <tr key={i} className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                                                                                            {Object.values(row).map((value, j) => (
                                                                                                <td key={j} className="px-3 py-2">
                                                                                                    {value === null ? (
                                                                                                        <span className="text-gray-500 italic">NULL</span>
                                                                                                    ) : typeof value === 'object' ? (
                                                                                                        JSON.stringify(value)
                                                                                                    ) : (
                                                                                                        String(value)
                                                                                                    )}
                                                                                                </td>
                                                                                            ))}
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {msg.bot.result && !Array.isArray(msg.bot.result) && (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center space-x-2">
                                                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                                                            <span className="text-sm font-medium">Query Result</span>
                                                                        </div>
                                                                        <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                                                            <p className="text-sm">{msg.bot.result}</p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="flex items-start space-x-3">
                                            <div className={`rounded-2xl px-4 py-3 shadow-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <Bot className="w-4 h-4 text-green-500" />
                                                    <span className="text-sm font-medium">SQL Assistant</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Loader className="w-4 h-4 animate-spin text-blue-500" />
                                                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        Analyzing query...
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className={`p-6 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50/50'}`}>
                                <div className="flex items-end space-x-3">
                                    <div className="flex-1 relative">
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            placeholder="Ask about your database (e.g., 'Show me all users from last week')"
                                            className={`w-full px-4 py-3 rounded-xl resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark'
                                                    ? 'bg-gray-700 text-white border border-gray-600 placeholder-gray-400'
                                                    : 'bg-white text-gray-900 border border-gray-300 placeholder-gray-500'
                                                }`}
                                            rows={input.includes('\n') ? 3 : 1}
                                            disabled={isLoading}
                                        />
                                        <div className="absolute right-3 top-3 flex items-center space-x-2">
                                            <kbd className={`px-2 py-1 text-xs rounded ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                                Enter
                                            </kbd>
                                        </div>
                                    </div>
                                    <button
                                        onClick={sendMessage}
                                        disabled={isLoading || !input.trim()}
                                        className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${isLoading || !input.trim()
                                                ? theme === 'dark'
                                                    ? 'bg-gray-600 cursor-not-allowed'
                                                    : 'bg-gray-300 cursor-not-allowed'
                                                : theme === 'dark'
                                                    ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                                                    : 'bg-blue-500 hover:bg-blue-600 shadow-lg hover:shadow-xl'
                                            }`}
                                    >
                                        {isLoading ? (
                                            <Loader className="w-5 h-5 animate-spin text-white" />
                                        ) : (
                                            <Send className="w-5 h-5 text-white" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatBot;