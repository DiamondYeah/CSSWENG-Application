interface InstagramSettingsProps {
    collaborator: string;
    setCollaborator: (value: string) => void;
}

function InstagramSettings({
    collaborator,
    setCollaborator
}: InstagramSettingsProps) {

    return (
        <div className="cp-card">
            <div className="cp-section-title">
                Instagram Settings
            </div>

            <div className="cp-section-sub">
                Add a collaborator to your Instagram post.
            </div>

            <div className="cp-field">
                <label className="cp-label">
                    Collaborator
                </label>

                <input
                    type="text"
                    value={collaborator}
                    onChange={(e) => setCollaborator(e.target.value)}
                    placeholder="@username"
                    className="cp-input"
                />

                <div className="cp-section-sub">
                    Enter the Instagram username of the account you want to invite as a collaborator.
                </div>
            </div>
        </div>
    );
}

export default InstagramSettings;