
            } catch(e) {
                console.log("Error:", e.response ? e.response.status : e.message);
            }
        }
    } catch(e) {
        console.log("Error:", e.message);
    } finally {
        process.exit(0);
    }
}
run();
