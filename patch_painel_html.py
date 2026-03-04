with open("painel-94k2.html", "r") as f:
    content = f.read()

custom_modal_html = """
<!-- Custom Modal Overlay -->
<div id="custom-modal-overlay" class="custom-modal-overlay" style="display: none;">
    <div class="custom-modal-content">
        <p id="custom-modal-message" class="custom-modal-message"></p>
        <div id="custom-modal-buttons" class="custom-modal-buttons">
            <!-- Buttons will be injected here via JS -->
        </div>
    </div>
</div>
"""

if "id=\"custom-modal-overlay\"" not in content:
    content = content.replace("<script type=\"module\" src=\"js/painel-94k2.js?v=2\"></script>", custom_modal_html + "\n<script type=\"module\" src=\"js/painel-94k2.js?v=3\"></script>")

with open("painel-94k2.html", "w") as f:
    f.write(content)
