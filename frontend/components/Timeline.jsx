export function Timeline({ children }) {
  return (
    <div className="relative pl-10">
      {/* vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-1 bg-gray-300"></div>

      <div className="space-y-8">{children}</div>
    </div>
  );
}

export function TimelineEvent({
  icon,
  title,
  subtitle,
  email,
  account,
  timestamp,
}) {
  return (
    <div className="relative">

      {/* dot */}
      <div className="absolute -left-[18px] top-3 w-4 h-4 rounded-full bg-pharmaGreen-700 border-2 border-white"></div>

      <div className="bg-white p-4 rounded-lg shadow-md flex gap-4">
        <div className="text-pharmaGreen-700 mt-1">{icon}</div>

        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-xs uppercase text-gray-500">{subtitle}</p>

          {email && <p className="text-sm">{email}</p>}
          {account && <p className="text-xs text-gray-500">{account}</p>}

          {timestamp && (
            <p className="text-xs text-gray-400 mt-1">
              {new Date(Number(timestamp) * 1000).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
