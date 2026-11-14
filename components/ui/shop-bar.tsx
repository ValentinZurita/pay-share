function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return letters || "PS";
}

export function ShopBar({
  restaurant,
  end,
}: {
  restaurant: string;
  end?: React.ReactNode;
}) {
  return (
    <div className="bar">
      <span className="ava" aria-hidden="true">
        {initials(restaurant)}
      </span>
      <span className="name">{restaurant}</span>
      {end ? <span className="end">{end}</span> : null}
    </div>
  );
}
