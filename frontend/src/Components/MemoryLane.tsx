import React from 'react';
import { ChatMessage } from '../types';
import { format } from 'date-fns';

interface MemoryLaneProps {
    messages: ChatMessage[];
    today: Date;
}

const MemoryLane: React.FC<MemoryLaneProps> = ({ messages, today }) => {
    // Find messages from this day in previous years
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();
    const onThisDayMessages = messages.filter(msg => {
        const msgDate = new Date(msg.timestamp);
        return msgDate.getMonth() === todayMonth && msgDate.getDate() === todayDate && msgDate.getFullYear() !== today.getFullYear();
    });

    if (onThisDayMessages.length === 0) {
        return <div className="p-4 text-gray-500">No memories for this day in past years.</div>;
    }

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">On This Day</h2>
            {onThisDayMessages.map(msg => (
                <div key={msg.id} className="mb-4 p-3 bg-yellow-50 rounded shadow">
                    <div className="text-sm text-gray-600">{format(new Date(msg.timestamp), 'yyyy')}</div>
                    <div className="font-semibold">{msg.sender}</div>
                    <div>{msg.content}</div>
                </div>
            ))}
        </div>
    );
};

export default MemoryLane; 