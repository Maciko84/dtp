async function dtp(node, url, site) {
    const connection = new WebSocket(url);
    const nodes = { main: node };

    // Helper function to send error messages and handle critical errors
    function sendError(message, critical = false) {
        const errorMessage = JSON.stringify({
            type: 'error',
            message: message,
            critical: critical
        });
        connection.send(errorMessage);
        if (critical) {
            // Close the connection on critical errors
            connection.close();
        }
    }

    // Helper function to add event listeners to a node
    function addEventListeners(element, id, events) {
        if (events && Array.isArray(events)) {
            events.forEach(eventName => {
                if (eventName && typeof eventName === 'string') {
                    element.addEventListener(eventName, function (event) {
                        connection.send(JSON.stringify({
                            type: 'event',
                            id: id,
                            name: eventName
                        }));
                    });
                }
            });
        }
    }

    // Helper function to deep merge properties
    function deepMerge(target, source) {
        for (const key of Object.keys(source)) {
            if (source[key] instanceof Object && target[key] instanceof Object) {
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }

    // Helper function to get a nested property
    function getNestedProperty(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    connection.onmessage = function (e) {
        let msg;
        try {
            msg = JSON.parse(e.data);
        } catch (err) {
            sendError('Invalid message format', true);
            return;
        }

        if (msg.type === 'create') {
            try {
                if (!msg.mode || !msg.props || !msg.id) sendError('Invalid create message', true);
                const newnode = document.createElement(msg.mode);
                deepMerge(newnode, msg.props);
                nodes[msg.id] = newnode;
                addEventListeners(newnode, msg.id, msg.events);
            } catch (err) {
                sendError(`Create operation failed: ${err.message}`, true);
            }
        } else if (msg.type === 'update') {
            try {
                const gotnode = nodes[msg.id];
                if (!gotnode) {
                    sendError('Node not found', true);
                    return;
                }
                deepMerge(gotnode, msg.props);
                addEventListeners(gotnode, msg.events); // Update event listeners if provided
            } catch (err) {
                sendError(`Update operation failed: ${err.message}`, true);
            }
        } else if (msg.type === 'delete') {
            try {
                const gotnode = nodes[msg.id];
                if (!gotnode || !gotnode.parentNode) {
                    sendError('Node or parent not found', true);
                    return;
                }
                gotnode.parentNode.removeChild(gotnode);
                delete nodes[msg.id];
            } catch (err) {
                sendError(`Delete operation failed: ${err.message}`, true);
            }
        } else if (msg.type === 'set_parent') {
            try {
                const gotnode = nodes[msg.child_id];
                const gotparent = nodes[msg.parent_id];
                if (!gotnode || !gotparent) {
                    sendError('Node or parent not found', true);
                    return;
                }
                gotparent.appendChild(gotnode);
                gotnode.parentNodeId = msg.parent_id;
            } catch (err) {
                sendError(`Set parent operation failed: ${err.message}`, true);
            }
        } else if (msg.type === 'get_parent') {
            try {
                if (msg.id !== 'main') {
                    const parentNodeId = nodes[msg.node_id]?.parentNodeId || null;
                    connection.send(JSON.stringify({ type: 'response', value: parentNodeId }));
                } else {
                    connection.send(JSON.stringify({ type: 'response', value: null }));
                }
            } catch (err) {
                sendError(`Get parent operation failed: ${err.message}`, true);
            }
        } else if (msg.type === 'get_prop') {
            try {
                const gotnode = nodes[msg.id];
                if (!gotnode) {
                    sendError('Node not found', true);
                    return;
                }
                const value = getNestedProperty(gotnode, msg.path || '');
                connection.send(JSON.stringify({ type: 'response', value: value }));
            } catch (err) {
                sendError(`Get property operation failed: ${err.message}`, true);
            }
        } else {
            sendError('Unknown message type', false);
        }
    };

    connection.onerror = (error) => {
        sendError(`WebSocket error: ${error.message}`, true);
    };

    connection.onclose = () => {
        return;
    };

    connection.onopen = () => {
        connection.send(site);
    };
}