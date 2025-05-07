import React from "react";

interface InputProps {
  label: string;
  type: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  type,
  value,
  onChange,
  error,
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-300">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="mt-1 block w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:border-indigo-500 focus:ring-indigo-500 text-gray-300"
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export default Input;
