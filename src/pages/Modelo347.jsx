import { useState, useEffect } from "react";
import api from "../api/axios";
import { useLanguage } from "../context/LanguageContext";
import { useNotification } from "../context/NotificationContext";
import useAuth from "../hooks/useAuth";

const Modelo347 = () => {
  const { t } = useLanguage();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [rentalClients, setRentalClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(null); // Client ID being edited
  const [editFormData, setEditFormData] = useState({});
  const [declarerInfo, setDeclarerInfo] = useState({
    nif: "",
    name: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
  });

  useEffect(() => {
    if (user) {
      setDeclarerInfo((prev) => ({
        ...prev,
        name: `${user.name || ""} ${user.lastName || ""}`.trim(),
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch 347 candidates
      const res = await api.get(`/invoices/modelo347?year=${year}`);
      setClients(res.data);
      // Determine selection (default all)
      setSelectedClients(res.data.map((c) => c._id));
    } catch (error) {
      console.error(error);
      showNotification(t("error"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectClient = (id) => {
    if (selectedClients.includes(id)) {
      setSelectedClients(selectedClients.filter((c) => c !== id));
    } else {
      setSelectedClients([...selectedClients, id]);
    }
  };

  const handleRentalToggle = (id) => {
    if (rentalClients.includes(id)) {
      setRentalClients(rentalClients.filter((c) => c !== id));
    } else {
      setRentalClients([...rentalClients, id]);
    }
  };

  const hasMissingInfo = (client) => {
    return (
      !client.clientNIF ||
      !client.clientProvince ||
      !client.clientPostalCode ||
      !client.clientCity
    );
  };

  // Step 2 Logic - Editing Missing Info
  const handleEditClick = (client) => {
    setIsEditing(client._id);
    setEditFormData({
      province: client.clientProvince || "",
      postalCode: client.clientPostalCode || "",
      city: client.clientCity || "",
      nif: client.clientNIF || "",
    });
  };

  const handleEditSave = async (clientId) => {
    try {
      await api.put(`/clients/${clientId}`, {
        province: editFormData.province,
        postalCode: editFormData.postalCode,
        city: editFormData.city,
        nif: editFormData.nif,
      });
      showNotification(t("changesSaved"), "success");
      setIsEditing(null);
      fetchData(); // Refresh data
    } catch (error) {
      console.error(error);
      showNotification(t("error"), "error");
    }
  };

  const renderStep1 = () => (
    <div>
      <h3 className="text-xl font-bold mb-4">
        Step 1: {t("chooseExistingClient")}
      </h3>
      <p className="mb-4 text-gray-600">
        {t("clients")} &gt; 3.005,06€ in {year}.
      </p>
      {isLoading ? (
        <p>{t("loading")}</p>
      ) : clients.length === 0 ? (
        <p>{t("noResults")}</p>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase">
              <tr>
                <th className="p-3">{t("actions")}</th>
                <th className="p-3">{t("client")}</th>
                <th className="p-3">{t("clientNIF")}</th>
                <th className="p-3 text-right">{t("totalAmount")}</th>
                <th className="p-3 text-center">{t("isRental")}</th>
                <th className="p-3">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const missing = hasMissingInfo(client);
                return (
                  <tr key={client._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client._id)}
                        onChange={() => handleSelectClient(client._id)}
                      />
                    </td>
                    <td className="p-3 font-medium">{client.clientName}</td>
                    <td className="p-3">{client.clientNIF || "MISSING"}</td>
                    <td className="p-3 text-right">
                      {client.totalAmount.toFixed(2)}€
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={rentalClients.includes(client._id)}
                        onChange={() => handleRentalToggle(client._id)}
                      />
                    </td>
                    <td className="p-3">
                      {missing ? (
                        <span className="text-red-500 font-bold">
                          {t("incompleteData")}
                        </span>
                      ) : (
                        <span className="text-green-500">{t("ready")}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex justify-end mt-4">
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={() => setStep(2)}
          disabled={clients.length === 0 || selectedClients.length === 0}
        >
          {t("next")}
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const selectedData = clients.filter((c) => selectedClients.includes(c._id));
    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Step 2: {t("clientDetails")}</h3>
        <p className="mb-4 text-gray-600">
          Please provide missing details for the selected clients.
        </p>

        <div className="grid gap-4">
          {selectedData.map((client) => {
            const isMissing = hasMissingInfo(client);
            if (!isMissing && isEditing !== client._id) return null;

            const isCurrentEditing = isEditing === client._id;

            return (
              <div
                key={client._id}
                className={`p-4 rounded border ${
                  isMissing
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold">{client.clientName}</h4>
                    <p className="text-sm text-gray-500">
                      {t("totalAmount")}: {client.totalAmount.toFixed(2)}€
                    </p>
                  </div>
                  {!isCurrentEditing && (
                    <button
                      className="text-indigo-600 text-sm hover:underline"
                      onClick={() => handleEditClick(client)}
                    >
                      {t("edit")}
                    </button>
                  )}
                </div>

                {isCurrentEditing ? (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700">
                        {t("clientNIF")}
                      </label>
                      <input
                        className="w-full border rounded p-1 text-sm"
                        value={editFormData.nif}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            nif: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700">
                        {t("province")}
                      </label>
                      <input
                        className="w-full border rounded p-1 text-sm"
                        value={editFormData.province}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            province: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700">
                        {t("city")}
                      </label>
                      <input
                        className="w-full border rounded p-1 text-sm"
                        value={editFormData.city}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            city: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700">
                        {t("postalCode")}
                      </label>
                      <input
                        className="w-full border rounded p-1 text-sm"
                        value={editFormData.postalCode}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            postalCode: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-2 flex justify-end gap-2 mt-2">
                      <button
                        className="px-3 py-1 bg-gray-200 rounded text-sm"
                        onClick={() => setIsEditing(null)}
                      >
                        {t("cancel")}
                      </button>
                      <button
                        className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
                        onClick={() => handleEditSave(client._id)}
                      >
                        {t("save")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                    <div>
                      <span className="font-semibold">{t("clientNIF")}:</span>{" "}
                      {client.clientNIF || "-"}
                    </div>
                    <div>
                      <span className="font-semibold">{t("province")}:</span>{" "}
                      {client.clientProvince || "-"}
                    </div>
                    <div>
                      <span className="font-semibold">{t("city")}:</span>{" "}
                      {client.clientCity || "-"}
                    </div>
                    <div>
                      <span className="font-semibold">{t("postalCode")}:</span>{" "}
                      {client.clientPostalCode || "-"}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between mt-4">
          <button
            className="px-4 py-2 border rounded"
            onClick={() => setStep(1)}
          >
            {t("previous")}
          </button>
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded"
            onClick={() => setStep(3)}
          >
            {t("next")}
          </button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const selectedData = clients.filter((c) => selectedClients.includes(c._id));

    // Calculate Summary Boxes
    const box01 = selectedData.length;
    const box02 = selectedData.reduce((acc, c) => acc + c.totalAmount, 0);
    const box03 = selectedData.filter((c) =>
      rentalClients.includes(c._id)
    ).length;
    const box04 = selectedData
      .filter((c) => rentalClients.includes(c._id))
      .reduce((acc, c) => acc + c.totalAmount, 0);

    const handleDeclarerChange = (e) => {
      setDeclarerInfo({ ...declarerInfo, [e.target.name]: e.target.value });
    };

    const handleDownloadPDF = async () => {
      try {
        const response = await api.post(
          "/invoices/modelo347/pdf",
          {
            year,
            declarerInfo,
            selectedClientIds: selectedClients,
            summaryBoxes: {
              box01,
              box02,
              box03,
              box04,
            },
            rentalClientIds: rentalClients,
          },
          { responseType: "blob" }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Modelo347_${year}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error("Error downloading PDF:", error);
        showNotification(t("error"), "error");
      }
    };

    return (
      <div className="print:w-full">
        <h3 className="text-xl font-bold mb-4 print:hidden">
          Step 3: Modelo 347 Report
        </h3>

        {/* Declarer Section */}
        <div className="mb-6 p-4 border-2 border-gray-800 bg-white text-sm">
          <h4 className="font-bold text-lg mb-2 border-b-2 border-gray-800 pb-1">
            DECLARANTE (Sujeto Pasivo)
          </h4>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <label className="block text-xs font-bold">NIF / CIF</label>
              <input
                name="nif"
                value={declarerInfo.nif}
                onChange={handleDeclarerChange}
                className="w-full border-b border-gray-400 focus:outline-none py-1"
                placeholder="NIF"
              />
            </div>
            <div className="col-span-9">
              <label className="block text-xs font-bold">
                Nombre / Razón Social
              </label>
              <input
                name="name"
                value={declarerInfo.name}
                onChange={handleDeclarerChange}
                className="w-full border-b border-gray-400 focus:outline-none py-1"
                placeholder="Nombre"
              />
            </div>
            <div className="col-span-12">
              <label className="block text-xs font-bold">Domicilio</label>
              <input
                name="address"
                value={declarerInfo.address}
                onChange={handleDeclarerChange}
                className="w-full border-b border-gray-400 focus:outline-none py-1"
                placeholder="Calle, número, piso..."
              />
            </div>
            <div className="col-span-4">
              <label className="block text-xs font-bold">Municipio</label>
              <input
                name="city"
                value={declarerInfo.city}
                onChange={handleDeclarerChange}
                className="w-full border-b border-gray-400 focus:outline-none py-1"
                placeholder="Municipio"
              />
            </div>
            <div className="col-span-4">
              <label className="block text-xs font-bold">Código Postal</label>
              <input
                name="postalCode"
                value={declarerInfo.postalCode}
                onChange={handleDeclarerChange}
                className="w-full border-b border-gray-400 focus:outline-none py-1"
                placeholder="CP"
              />
            </div>
            <div className="col-span-4">
              <label className="block text-xs font-bold">Provincia</label>
              <input
                name="province"
                value={declarerInfo.province}
                onChange={handleDeclarerChange}
                className="w-full border-b border-gray-400 focus:outline-none py-1"
                placeholder="Provincia"
              />
            </div>
          </div>
        </div>

        {/* Summary Boxes Section */}
        <div className="mb-6 p-4 border-2 border-orange-500 bg-orange-50 text-sm rounded-lg">
          <h4 className="font-bold text-lg mb-4 text-orange-800 border-b border-orange-200 pb-2">
            Resumen de los datos incluidos en la declaración
          </h4>
          <div className="grid gap-3">
            <div className="flex justify-between items-center border-b border-orange-100 pb-2">
              <span className="text-gray-700">
                {t("box01")}{" "}
                ..................................................................................
              </span>
              <div className="flex gap-2 items-center">
                <span className="bg-white border-2 border-black px-2 py-0.5 font-bold">
                  01
                </span>
                <span className="bg-white border-2 border-black px-4 py-0.5 w-32 text-right font-bold">
                  {box01}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center border-b border-orange-100 pb-2">
              <span className="text-gray-700">
                {t("box02")}{" "}
                ..................................................................................
              </span>
              <div className="flex gap-2 items-center">
                <span className="bg-white border-2 border-black px-2 py-0.5 font-bold">
                  02
                </span>
                <span className="bg-white border-2 border-black px-4 py-0.5 w-32 text-right font-bold">
                  {box02.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center border-b border-orange-100 pb-2">
              <span className="text-gray-700">
                {t("box03")}{" "}
                ..................................................................................
              </span>
              <div className="flex gap-2 items-center">
                <span className="bg-white border-2 border-black px-2 py-0.5 font-bold">
                  03
                </span>
                <span className="bg-white border-2 border-black px-4 py-0.5 w-32 text-right font-bold">
                  {box03}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">
                {t("box04")}{" "}
                ..................................................................................
              </span>
              <div className="flex gap-2 items-center">
                <span className="bg-white border-2 border-black px-2 py-0.5 font-bold">
                  04
                </span>
                <span className="bg-white border-2 border-black px-4 py-0.5 w-32 text-right font-bold">
                  {box04.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 uppercase text-xs">
              <tr>
                <th className="p-2 border">{t("clientNIF")}</th>
                <th className="p-2 border">{t("clientName")}</th>
                <th className="p-2 border">Prov. Code</th>
                <th className="p-2 border text-right">{t("totalAmount")}</th>
                <th className="p-2 border text-right">Q1</th>
                <th className="p-2 border text-right">Q2</th>
                <th className="p-2 border text-right">Q3</th>
                <th className="p-2 border text-right">Q4</th>
              </tr>
            </thead>
            <tbody>
              {selectedData.map((client) => (
                <tr key={client._id} className="border-b">
                  <td className="p-2 border">{client.clientNIF}</td>
                  <td className="p-2 border">{client.clientName}</td>
                  <td className="p-2 border">
                    {client.clientPostalCode
                      ? client.clientPostalCode.substring(0, 2)
                      : ""}
                  </td>
                  <td className="p-2 border text-right font-bold">
                    {client.totalAmount.toFixed(2)}
                  </td>
                  <td className="p-2 border text-right">
                    {client.q1.toFixed(2)}
                  </td>
                  <td className="p-2 border text-right">
                    {client.q2.toFixed(2)}
                  </td>
                  <td className="p-2 border text-right">
                    {client.q3.toFixed(2)}
                  </td>
                  <td className="p-2 border text-right">
                    {client.q4.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between mt-6 print:hidden">
          <button
            className="px-4 py-2 border rounded"
            onClick={() => setStep(2)}
          >
            {t("previous")}
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={handleDownloadPDF}
          >
            {t("downloadPDF")}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Modelo 347 Generator</h2>
        <div>
          <label className="mr-2 font-semibold">Fiscal Year:</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded p-1"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
};

export default Modelo347;
