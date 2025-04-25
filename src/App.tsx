import React, { useEffect, useState } from "react";

interface Person {
  first_name: string;
  last_name: string;
  company_name: string;
  address: string;
  city: string;
  county: string;
  state: string;
  zip: string;
  phone1: string;
  phone2: string;
  email: string;
  web: string;
}

function App() {
  const [data, setData] = useState<Person[]>([]);
  const [searchField, setSearchField] = useState<keyof Person>("state");
  const [targetValue, setTargetValue] = useState("");
  const [filteredData, setFilteredData] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingFallback, setUsingFallback] = useState(false);
  const [stateSummary, setStateSummary] = useState<Record<string, number>>({});
  const [showSummary, setShowSummary] = useState(true);
  const [showVisualSummary, setShowVisualSummary] = useState(true);
  const [summarySortField, setSummarySortField] = useState<"state" | "zip" | "county" | "city">("state");

  const getColor = (index: number) => {
    const colors = ["#4e73df", "#e74a3b", "#f6c23e", "#1cc88a", "#36b9cc", "#ff9f40"];
    return colors[index % colors.length];
  };

  const CSV_parser = (text: string): Person[] => {
    try {
      const cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/""/g, '"').trim();
      const lines = cleaned.split("\n").filter(line => line.trim());
      if (lines.length < 2) return [];

      let headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
      if (headers.length !== 12) {
        headers = ["first_name", "last_name", "company_name", "address", "city", "county", "state", "zip", "phone1", "phone2", "email", "web"];
      }

      const result: Person[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/(?:[^,"]+|"[^"]*")+/g) || [];
        if (values.length !== headers.length) continue;
        const person: any = {};
        headers.forEach((header, index) => {
          let value = values[index] || "";
          value = value.replace(/^"|"$/g, "").trim();
          person[header] = value;
        });
        result.push(person as Person);
      }
      return result;
    } catch {
      return [];
    }
  };

  const getFallbackData = async (): Promise<Person[]> => {
    return [{
      first_name: "-", last_name: "-", company_name: "-", address: "-",
      city: "-", county: "-", state: "-", zip: "-", phone1: "-", phone2: "-", email: "-", web: "-"
    }];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        setUsingFallback(false);
        const response = await fetch("https://raw.githubusercontent.com/jinchen003/Nearabl.Sample.Data/main/us-500.csv", { cache: "no-store" });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const text = await response.text();
        const parsedData = CSV_parser(text);
        if (parsedData.length === 0) throw new Error("CSV parsing completed but no valid data found");
        setData(parsedData);
        setFilteredData(parsedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        setUsingFallback(true);
        const fallbackData = await getFallbackData();
        setData(fallbackData);
        setFilteredData(fallbackData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const summary: Record<string, number> = {};
    data.forEach((person) => {
      const key = person[summarySortField] || "Unknown";
      summary[key] = (summary[key] || 0) + 1;
    });
    setStateSummary(summary);
  }, [data, summarySortField]);

  useEffect(() => {
    if (!targetValue) {
      setFilteredData(data);
      return;
    }
    const results = data.filter((person) =>
      String(person[searchField]).toLowerCase().includes(targetValue.toLowerCase())
    );
    setFilteredData(results);
  }, [targetValue, searchField, data]);

  const renderSingleResult = (person: Person) => {
    if (searchField === "first_name" && filteredData.length === 1) {
      return (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <img src="/user.png" alt="User icon" style={{ width: 120, height: 120, borderRadius: "50%" }} />
          <h2>{person.first_name} {person.last_name}</h2>
          <p><strong>Company:</strong> {person.company_name}</p>
          <p><strong>Address:</strong> {person.address}, {person.city}, {person.state} {person.zip}</p>
          <p><strong>Phone:</strong> {person.phone1 || person.phone2 || "N/A"}</p>
          <p><strong>Email:</strong> {person.email}</p>
          <p><strong>Website:</strong> <a href={person.web} target="_blank" rel="noreferrer">{person.web}</a></p>
        </div>
      );
    }

    if (searchField === "company_name" && filteredData.length === 1) {
      return (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <h2>{person.company_name}</h2>
          <video controls style={{ width: "100%", maxWidth: "400px", margin: "1rem 0" }}>
            <source src="/video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <p><strong>Contact:</strong> {person.first_name} {person.last_name}</p>
          <p><strong>Address:</strong> {person.address}, {person.city}, {person.state} {person.zip}</p>
          <p><strong>Phone:</strong> {person.phone1 || person.phone2 || "N/A"}</p>
          <p><strong>Email:</strong> {person.email}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) return <div style={{ padding: "2rem" }}>Loading...</div>;

  return (
    <div style={{ padding: "2rem", fontFamily: "Boulder", maxWidth: "1100px", margin: "0 auto" }}>
      <h1 style={{ color: "#2A2D77" }}>neARabl Coding Exercise</h1>

      {/* Search Bar */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <label>
          Search by:
          <select value={searchField} onChange={(e) => setSearchField(e.target.value as keyof Person)} style={{ marginLeft: "0.5rem", padding: "0.4rem" }}>
            {data[0] && Object.keys(data[0]).map((key) => (
              <option key={key} value={key}>{key.replace(/_/g, " ")}</option>
            ))}
          </select>
        </label>
        <input
          type="text"
          placeholder={`Search ${searchField.replace(/_/g, " ")}`}
          value={targetValue}
          onChange={(e) => setTargetValue(e.target.value)}
          style={{ padding: "0.5rem", flex: 1 }}
        />
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <button onClick={() => setShowVisualSummary(!showVisualSummary)} style={{ padding: "0.5rem 1rem" }}>
          {showVisualSummary ? "Hide Doughnut Chart" : "Show Doughnut Chart"}
        </button>
        <button onClick={() => setShowSummary(!showSummary)} style={{ padding: "0.5rem 1rem" }}>
          {showSummary ? "Hide Summary" : "Show Summary"}
        </button>
      </div>

      {showVisualSummary && Object.keys(stateSummary).length > 0 && (
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h3>Doughnut Chart Summary</h3>
          <div style={{
            position: "relative",
            width: "200px",
            height: "200px",
            margin: "1rem auto",
            borderRadius: "50%",
            background: `conic-gradient(${Object.entries(stateSummary).map(([_, count], i) => {
              const total = Object.values(stateSummary).reduce((a, b) => a + b, 0);
              const start = Object.values(stateSummary).slice(0, i).reduce((a, b) => a + b, 0) / total * 100;
              const end = start + (count / total * 100);
              return `${getColor(i)} ${start}% ${end}%`;
            }).join(", ")})`
          }}>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "100px",
              height: "100px",
              marginTop: "-50px",
              marginLeft: "-50px",
              backgroundColor: "white",
              borderRadius: "50%"
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "1rem" }}>
            {Object.entries(stateSummary).map(([label, count], i) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: getColor(i), display: "inline-block" }} />
                <span>{label} ({count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSummary && Object.keys(stateSummary).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          {Object.entries(stateSummary).map(([label, count], i) => {
            const total = Object.values(stateSummary).reduce((a, b) => a + b, 0);
            const percent = ((count / total) * 100).toFixed(1);
            return (
              <div key={label} style={{ padding: "0.5rem 1rem", backgroundColor: getColor(i), color: "#fff", borderRadius: "20px" }}>
                <strong>{label}</strong>: {percent}%
              </div>
            );
          })}
        </div>
      )}

      {filteredData.length === 1 && renderSingleResult(filteredData[0])}

      {!(filteredData.length === 1 && (searchField === "first_name" || searchField === "company_name")) && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "200%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#080b70", color: "#fff" }}>
                {data[0] && Object.keys(data[0]).map((key) => (
                  <th key={key} style={{ padding: "10px", textAlign: "left" }}>{key.replace(/_/g, " ")}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((person, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f5f5f5" }}>
                  {Object.values(person).map((val, i) => (
                    <td key={i} style={{ padding: "10px" }}>{val || "-"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;